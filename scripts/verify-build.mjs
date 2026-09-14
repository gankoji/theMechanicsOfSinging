import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { load } from "cheerio";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import { site, base } from "../site.config.mjs";

export const requiredPaths = [
  "index.html", "essays/index.html", "resources/index.html",
  "musical-cv/index.html",
  "learning-the-instrument/index.html", "mechanics-of-music/index.html",
  "thematic-elements/thematic-elements-presentation.html", "barbershop-analyzer/index.html",
  ...["But How Should I Sing It.pdf", "But How Should I Sing It.txt",
    "But How Should I Sing It (Summary).md", "thematic-elements-outline.md",
    "thematic-elements.org"].map((name) => `thematic-elements/${name}`),
];

export async function verifyBuild(directory = "dist", { required = requiredPaths, essayDirectory = null } = {}) {
  const root = resolve(directory);
  const errors = [];
  const documents = new Map();
  async function walk(dir) {
    return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(async (entry) => {
      const path = resolve(dir, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }))).flat();
  }
  const files = await walk(root);
  for (const name of required) {
    if (!files.includes(resolve(root, name))) errors.push(`Missing required published resource: ${name}`);
  }
  for (const file of files.filter((file) => extname(file) === ".html")) {
    documents.set(file, load(await readFile(file, "utf8")));
  }
  if (essayDirectory) {
    const slugs = new Set();
    for (const source of (await walk(resolve(essayDirectory))).filter((file) => extname(file) === ".md")) {
      const { frontmatter } = parseFrontmatter(await readFile(source, "utf8"));
      const { slug, draft } = frontmatter;
      if (slugs.has(slug)) errors.push(`Duplicate essay slug: ${slug}`);
      slugs.add(slug);
      const route = resolve(root, `essays/${slug}/index.html`);
      if (draft === false && !files.includes(route)) errors.push(`Missing published essay: ${slug}`);
      if (draft !== false && files.includes(route)) errors.push(`Draft essay was published: ${slug}`);
      if (draft !== false) {
        for (const [file, $] of documents) {
          if ($("a[href]").toArray().some((node) => {
            const url = new URL(node.attribs.href, `${site}${base}${relative(root, file)}`);
            return url.pathname === `${base}essays/${slug}/` || url.pathname === `${base}essays/${slug}/index.html`;
          })) errors.push(`${relative(root, file)}: link to draft essay ${slug}`);
        }
      }
    }
    for (const file of files) {
      if (relative(root, file).startsWith(`essays${sep}`) && extname(file) === ".md") {
        errors.push(`Raw essay source exposed: ${relative(root, file)}`);
      }
    }
  }
  async function check(value, source) {
    if (!value?.trim() || /^(?:data:|javascript:|mailto:|tel:|blob:)/i.test(value.trim())) return;
    const sourcePath = relative(root, source).split(sep).join("/");
    let url;
    try { url = new URL(value, `${site}${base}${sourcePath}`); }
    catch { errors.push(`${sourcePath}: invalid URL ${value}`); return; }
    if (url.origin !== new URL(site).origin || !/^https?:$/.test(url.protocol)) return;
    if (!url.pathname.startsWith(base)) {
      errors.push(`${sourcePath}: URL escapes project base: ${value}`); return;
    }
    let path;
    try { path = resolve(root, decodeURIComponent(url.pathname.slice(base.length))); }
    catch { errors.push(`${sourcePath}: invalid URL encoding ${value}`); return; }
    if (path !== root && !path.startsWith(root + sep)) {
      errors.push(`${sourcePath}: URL escapes output: ${value}`); return;
    }
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
      await stat(path);
    } catch { errors.push(`${sourcePath}: missing local target ${value}`); return; }
    if (url.hash && documents.has(path)) {
      let id;
      try { id = decodeURIComponent(url.hash.slice(1)); } catch { id = url.hash.slice(1); }
      // Browser text fragments do not refer to element IDs.
      id = id.split(":~:text=")[0];
      if (id && !documents.get(path)("[id], a[name]").toArray().some((node) =>
        node.attribs.id === id || node.attribs.name === id)) {
        errors.push(`${sourcePath}: missing fragment ${value}`);
      }
    }
  }
  async function css(text, source) {
    for (const match of text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi)) {
      await check(match[1] ?? match[2] ?? match[3], source);
    }
  }
  for (const [file, $] of documents) {
    const name = relative(root, file).split(sep).join("/");
    for (const node of $("[href], [src]").toArray()) {
      for (const attr of ["href", "src"]) if (node.attribs[attr]) await check(node.attribs[attr], file);
    }
    for (const node of $("style, [style]").toArray()) await css($(node).attr("style") ?? $(node).text(), file);
    const modern = name === "index.html" || name === "404.html" || /^(essays|resources|musical-cv)\//.test(name);
    if (!modern) continue;
    const ids = new Set();
    $("[id]").each((_, node) => {
      const id = node.attribs.id;
      if (ids.has(id)) errors.push(`${name}: duplicate ID ${id}`);
      ids.add(id);
    });
    if ($("h1").length !== 1) errors.push(`${name}: expected exactly one H1`);
    $(".katex").each((_, node) => {
      if (!$(node).find("math").length) errors.push(`${name}: math is missing MathML`);
    });
    $("table").each((_, node) => {
      const wrapper = $(node).parent();
      if (wrapper.attr("role") !== "region" || wrapper.attr("tabindex") !== "0" ||
          !(wrapper.attr("aria-label") || wrapper.attr("aria-labelledby"))) {
        errors.push(`${name}: table needs a named keyboard-scrollable region`);
      }
      if (!$(node).find("th").length || $(node).find("th:not([scope])").length) {
        errors.push(`${name}: table needs scoped headers`);
      }
    });
  }
  for (const file of files.filter((file) => extname(file) === ".css")) await css(await readFile(file, "utf8"), file);
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const errors = await verifyBuild(process.argv[2] ?? "dist", { essayDirectory: "essays" });
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log("Verified published routes, local links/assets/fragments, headings, tables, and math.");
}

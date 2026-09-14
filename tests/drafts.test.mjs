import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, symlink, writeFile, readFile, readdir, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("an isolated real Astro build excludes explicit and default drafts from routes and listings", { timeout: 120000 }, async () => {
  const root = resolve(".");
  const temp = await mkdtemp(join(tmpdir(), "singing-drafts-"));
  try {
    for (const name of ["src", "scripts", "essays", "astro.config.mjs", "site.config.mjs", "package.json", "tsconfig.json"]) {
      await cp(join(root, name), join(temp, name), { recursive: true });
    }
    await symlink(join(root, "node_modules"), join(temp, "node_modules"), "dir");
    // Existing published essays can be withdrawn too. Legacy recommendations
    // must keep working without bypassing the collection's publication rules.
    for (const name of ["essay_aproarte.md", "essay_just_intonation.md"]) {
      const file = join(temp, "essays", name);
      await writeFile(file, (await readFile(file, "utf8")).replace("draft: false", "draft: true"));
    }
    await mkdir(join(temp, ".legacy-public"));
    for (const name of ["learning-the-instrument", "mechanics-of-music"]) {
      await cp(join(root, name), join(temp, ".legacy-public", name), { recursive: true });
    }
    for (const [slug, draft] of [
      ["regression-hidden-explicit", "draft: true\n"],
      ["regression-hidden-default", ""],
      ["regression-published-control", "draft: false\n"],
    ]) {
      await writeFile(join(temp, "essays", `${slug}.md`), `---\nslug: ${slug}\ntitle: ${slug}\ndescription: Private regression fixture\ntopic: tuning\norder: 99\n${draft}---\n# Private\n\nNever publish this fixture.\n`);
    }
    const { stdout, stderr } = await promisify(execFile)(process.execPath,
      [join(root, "node_modules/astro/bin/astro.mjs"), "build"], { cwd: temp, timeout: 110000 });
    const routes = await readdir(join(temp, "dist/essays"));
    assert(routes.includes("vowel-resonance"), stdout + stderr);
    assert(!routes.includes("aproarte"));
    assert(!routes.includes("just-intonation"));
    assert(routes.includes("regression-published-control"), "The build must discover new fixture content");
    assert(!routes.some((name) => name.includes("regression-hidden")));
    for (const file of ["index.html", "essays/index.html", "resources/index.html", "essays/vowel-resonance/index.html"]) {
      const html = await readFile(join(temp, "dist", file), "utf8");
      assert.doesNotMatch(html, /regression-hidden/);
      assert.match(html, /regression-published-control/);
      assert.doesNotMatch(html, /href="[^"]*essays\/(?:aproarte|just-intonation)\//);
    }
    for (const name of ["learning-the-instrument", "mechanics-of-music"]) {
      const html = await readFile(join(temp, "dist", name, "index.html"), "utf8");
      assert.doesNotMatch(html, /href="[^"]*essays\/(?:aproarte|just-intonation)\//);
      assert.match(html, /href="\.\.\/resources\/#/);
    }
  } finally { await rm(temp, { recursive: true, force: true }); }
});

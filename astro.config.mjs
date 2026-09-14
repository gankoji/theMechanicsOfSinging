import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { essayHeadings, accessibleTables } from "./scripts/markdown.mjs";
import { site, base } from "./site.config.mjs";

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "always",
  publicDir: "./.legacy-public",
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, essayHeadings],
      rehypePlugins: [rehypeKatex, accessibleTables],
    }),
  },
});

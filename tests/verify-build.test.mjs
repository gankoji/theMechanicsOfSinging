import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyBuild } from "../scripts/verify-build.mjs";
import { base } from "../site.config.mjs";

test("verifier follows encoded assets, CSS URLs and fragments; rejects broken output", async () => {
  const dir = await mkdtemp(join(tmpdir(), "singing-verify-"));
  try {
    await mkdir(join(dir, "assets"));
    await writeFile(join(dir, "assets", "a b.svg"), "<svg/>");
    await writeFile(join(dir, "style.css"), 'a{background:url("./assets/a%20b.svg")}');
    await writeFile(join(dir, "index.html"), `<h1 id="title">Title</h1><a href="#title">Top</a>
      <a href="https://example.com/nope">External</a><a href="javascript:void(0)">Action</a>
      <link href="${base}style.css"><img src="assets/a%20b.svg">`);
    assert.deepEqual(await verifyBuild(dir, { required: ["index.html"] }), []);
    await writeFile(join(dir, "index.html"), `<h1 id="x">One</h1><h1 id="x">Two</h1>
      <a href="#missing">Broken</a><img src="/wrong-base.png"><img src="missing.png">
      <table><tr><th>Header</th></tr></table><span class="katex">No MathML</span>`);
    const errors = (await verifyBuild(dir, { required: ["absent.pdf"] })).join("\n");
    for (const pattern of [/required published/, /duplicate ID/, /exactly one H1/, /missing fragment/,
      /project base/, /missing local target/, /keyboard-scrollable/, /scoped headers/, /MathML/]) {
      assert.match(errors, pattern);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

import test from "node:test";
import assert from "node:assert/strict";
import { essayHeadings, accessibleTables } from "../scripts/markdown.mjs";

test("only the leading author H1 is removed; section hierarchy is preserved", () => {
  const heading = (depth) => ({ type: "heading", depth, children: [] });
  const tree = { type: "root", children: [heading(1), heading(2), heading(3)] };
  essayHeadings()(tree);
  assert.deepEqual(tree.children.map((node) => node.depth), [2, 3]);
  essayHeadings()(tree);
  assert.equal(tree.children.length, 2);
});

test("every table gets a separately named keyboard region and scoped headers", () => {
  const table = () => ({ type: "element", tagName: "table", properties: {}, children: [
    { type: "element", tagName: "th", properties: {}, children: [] },
  ] });
  const tree = { type: "root", children: [table(), table()] };
  accessibleTables()(tree);
  assert.equal(tree.children.length, 2);
  tree.children.forEach((wrapper, index) => {
    assert.equal(wrapper.tagName, "div");
    assert.equal(wrapper.properties.tabIndex, 0);
    assert.equal(wrapper.properties.role, "region");
    assert.match(wrapper.properties.ariaLabel, new RegExp(`Table ${index + 1}`));
    assert.equal(wrapper.children[0].children[0].properties.scope, "col");
  });
});

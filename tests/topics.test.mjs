import test from "node:test";
import assert from "node:assert/strict";
import { essayTopics } from "../src/data/resources.ts";

test("supplemental topics never override frontmatter and do not duplicate it", () => {
  assert.deepEqual(essayTopics("aproarte", "instrument"), ["instrument", "expression"]);
  assert.deepEqual(essayTopics("aproarte", "tuning"), ["tuning", "expression"]);
  assert.deepEqual(essayTopics("aproarte", "expression"), ["expression"]);
  assert.deepEqual(essayTopics("new-essay", "instrument"), ["instrument"]);
});

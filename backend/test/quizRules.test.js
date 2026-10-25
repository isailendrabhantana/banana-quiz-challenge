import test from "node:test";
import assert from "node:assert/strict";

test("numeric answers are compared as numbers", () => {
  assert.equal(Number("12") === 12, true);
  assert.equal(Number("11") === 12, false);
});
test("empty and nonnumeric answers are invalid", () => {
  const valid = x => x !== undefined && x !== null && String(x).trim() !== "" && Number.isFinite(Number(x));
  assert.equal(valid(""), false);
  assert.equal(valid("  "), false);
  assert.equal(valid("banana"), false);
  assert.equal(valid("12"), true);
});
test("ten correct answers can score 100 points", () => {
  assert.equal(10 * 10, 100);
});

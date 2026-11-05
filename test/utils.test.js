import assert from "node:assert/strict";
import { test } from "node:test";
import { applyPenalty, formatTime } from "../src/js/utils.js";

test("formatTime shows seconds, then minutes", () => {
  assert.equal(formatTime(8420, 3), "08.420");
  assert.equal(formatTime(8420, 2), "08.42");
  assert.equal(formatTime(61500, 3), "1:01.500");
});

test("formatTime rounds up to the next minute instead of showing 60 seconds", () => {
  assert.equal(formatTime(59999, 2), "1:00.00");
});

test("applyPenalty adds 2 seconds for +2 and returns null for DNF", () => {
  assert.equal(applyPenalty({ timeMs: 1000, penalty: "ok" }), 1000);
  assert.equal(applyPenalty({ timeMs: 1000, penalty: "plus2" }), 3000);
  assert.equal(applyPenalty({ timeMs: 1000, penalty: "dnf" }), null);
});

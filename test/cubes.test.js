import assert from "node:assert/strict";
import { test } from "node:test";
import { CUBE_CONFIG, buildScramble } from "../src/js/cubes.js";
import { validateScramble } from "../src/js/utils.js";

const AXIS = { R: "x", L: "x", U: "y", D: "y", F: "z", B: "z" };
const axisOf = (token) => AXIS[token.match(/[RLUDFB]/)[0]];

for (const [cubeType, config] of Object.entries(CUBE_CONFIG)) {
  test(`${cubeType} scramble has the right length and passes validation`, () => {
    const scramble = buildScramble(cubeType);
    assert.equal(scramble.length, config.scrambleLength);
    assert.ok(validateScramble(scramble.join(" "), config.moves, config.scrambleLength));
  });

  test(`${cubeType} scramble never repeats an axis twice in a row`, () => {
    const scramble = buildScramble(cubeType);
    scramble.slice(1).forEach((token, index) => {
      assert.notEqual(axisOf(token), axisOf(scramble[index]));
    });
  });
}

test("an unknown cube type falls back to 3x3", () => {
  assert.equal(buildScramble("9x9").length, CUBE_CONFIG["3x3"].scrambleLength);
});

test("validateScramble rejects a short or unknown scramble", () => {
  const { moves, scrambleLength } = CUBE_CONFIG["3x3"];
  assert.equal(validateScramble("R U", moves, scrambleLength), false);
  assert.equal(validateScramble(Array(20).fill("X").join(" "), moves, scrambleLength), false);
});

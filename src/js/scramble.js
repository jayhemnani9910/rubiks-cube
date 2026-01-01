import { DIRECTION_INDEX } from "./state.js";
import { applyTurn, resetCube } from "./cube.js";
import { getState } from "./storage.js";
import { buildScramble, getCubeConfig } from "./cubes.js";

const applyMoveToken = (token) => {
  const base = token[0].toLowerCase();
  const turns = token.includes("2") ? 2 : token.includes("'") ? 3 : 1;
  const index = DIRECTION_INDEX.get(base);
  if (index === undefined) {
    return;
  }

  for (let i = 0; i < turns; i += 1) {
    applyTurn(index, base);
  }
};

export const generateScramble = () => {
  const { cubeType } = getState().settings;
  const sequence = buildScramble(cubeType);
  const config = getCubeConfig(cubeType);

  const shouldApplyToCube = cubeType === "3x3" || cubeType === "2x2";

  resetCube();

  if (shouldApplyToCube) {
    sequence.forEach((token) => {
      if (token.includes("w")) {
        return;
      }
      applyMoveToken(token);
    });
  }

  const sequenceElement = document.getElementById("seq");
  if (sequenceElement) {
    sequenceElement.textContent = sequence.join(" ");
    sequenceElement.dataset.cube = config.label;
  }

  const cubeLabel = document.getElementById("cube-label");
  if (cubeLabel) {
    cubeLabel.textContent = config.label;
  }
};

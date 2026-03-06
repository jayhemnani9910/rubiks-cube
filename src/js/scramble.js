import { DIRECTION_INDEX } from "./state.js";
import { applyTurn, resetCube, applyScrambleToThreeCube } from "./cube.js";
import { getState } from "./storage.js";
import { buildScramble, getCubeConfig } from "./cubes.js";
import {
  resetCubeState,
  applyMoveToState,
  syncDOMFromState,
  syncPreviewFromState,
  getCubeSize,
} from "./dynamic-cube.js";

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
  const cubeSize = getCubeSize();

  // Reset both the visual cube and the logical state
  resetCube();
  resetCubeState();

  // Apply moves to logical state for all cube sizes
  sequence.forEach((token) => {
    applyMoveToState(token);
  });

  // For 3x3 and 2x2, also apply to the visual DOM cube (backwards compatible)
  // For larger cubes, the logical state is used for preview
  if (cubeSize <= 3) {
    sequence.forEach((token) => {
      // Skip wide moves for the 3x3 visual
      if (token.includes("w")) {
        return;
      }
      applyMoveToken(token);
    });

    // Apply scramble to Three.js cube instantly
    applyScrambleToThreeCube(sequence.filter(t => !t.includes("w")));
  }

  // Sync the preview from the logical state (works for all sizes)
  syncPreviewFromState();

  // Show/hide the cube note based on size
  const cubeNote = document.getElementById("cube-note");
  if (cubeNote) {
    cubeNote.classList.toggle("hide", cubeSize <= 3);
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

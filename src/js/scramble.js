import { resetCube, applyScrambleToThreeCube } from "./cube.js";
import { getState } from "./storage.js";
import { buildScramble, getCubeConfig } from "./cubes.js";
import {
  resetCubeState,
  applyMoveToState,
  syncPreviewFromState,
  getCubeSize,
} from "./dynamic-cube.js";

export const generateScramble = () => {
  const { cubeType } = getState().settings;
  const sequence = buildScramble(cubeType);
  const config = getCubeConfig(cubeType);

  resetCube();
  resetCubeState();

  // Apply moves to logical state
  sequence.forEach((token) => {
    applyMoveToState(token);
  });

  // Apply scramble to Three.js cube
  applyScrambleToThreeCube(sequence.filter(t => !t.includes("w")));

  syncPreviewFromState();

  const cubeNote = document.getElementById("cube-note");
  if (cubeNote) {
    cubeNote.classList.toggle("hide", getCubeSize() <= 3);
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

import { EMPTY_SCRAMBLE } from "./utils.js";
import { syncPreview } from "./preview.js";
import { getCubeSize } from "./dynamic-cube.js";
import { initThreeCube, rotateFace as threeRotateFace, resetCube as threeResetCube, rotateCubeView, applyScramble as threeApplyScramble, rebuildCube } from "./three-cube/ThreeCube.js";

let threeCube = null;
let pendingRebuildSize = null;

const VIEW_ROTATIONS = [
  { axis: 'y', angle: Math.PI / 6 },   // left
  { axis: 'x', angle: -Math.PI / 6 },  // up
  { axis: 'y', angle: -Math.PI / 6 },  // right
  { axis: 'x', angle: Math.PI / 6 },   // down
];

export const initCube = async () => {
  const container = document.getElementById("three-cube-container");
  if (!container) {
    console.warn("Three.js cube container not found");
    return;
  }

  try {
    const size = getCubeSize();
    const initSize = pendingRebuildSize ?? size;
    pendingRebuildSize = null;
    threeCube = await initThreeCube(container, initSize);
  } catch (error) {
    console.error("Failed to initialize Three.js cube:", error);
    container.style.display = "none";
  }
};

export const rotateFace = (key) => {
  if (threeCube) {
    threeRotateFace(key.toLowerCase(), false);
  }
};

export const rotateFacePrime = (key) => {
  if (threeCube) {
    threeRotateFace(key.toLowerCase(), true);
  }
};

export const rotateCube = (directionIndex) => {
  if (threeCube) {
    const { axis, angle } = VIEW_ROTATIONS[directionIndex];
    rotateCubeView(axis, angle);
  }
};

export const resetCube = () => {
  const sequence = document.getElementById("seq");
  if (sequence) {
    sequence.textContent = EMPTY_SCRAMBLE;
  }

  if (threeCube) {
    threeResetCube();
  }

  syncPreview();
};

export const applyScrambleToThreeCube = (sequence) => {
  if (threeCube) {
    threeApplyScramble(sequence);
  }
};

export const rebuildThreeCube = () => {
  const size = getCubeSize();
  if (threeCube) {
    rebuildCube(size);
  } else {
    pendingRebuildSize = size;
  }
};

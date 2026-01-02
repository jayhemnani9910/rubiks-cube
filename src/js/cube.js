import {
  DIRECTIONS,
  DIRECTION_INDEX,
  SIDE_ARRAY,
  FACE_ARRAY,
  TRANSLATION_MATRIX,
  STATE_MAP,
  cubeState,
  getFaceColors,
} from "./state.js";
import { syncPreview } from "./preview.js";
import { getCubeSize } from "./dynamic-cube.js";
import { initThreeCube, rotateFace as threeRotateFace, resetCube as threeResetCube, rotateCubeView, applyScramble as threeApplyScramble, rebuildCube } from "./three-cube/ThreeCube.js";

// Three.js cube instance
let threeCube = null;

const getElement = (id) => document.getElementById(id);
const getPartColor = (id) => {
  const el = getElement(id);
  if (!el) return null;
  return window.getComputedStyle(el).getPropertyValue("background-color");
};

/**
 * Initialize the Three.js 3D cube
 */
export const initCube = async () => {
  const container = document.getElementById("three-cube-container");
  if (!container) {
    console.warn("Three.js cube container not found");
    return;
  }

  try {
    const size = getCubeSize();
    threeCube = await initThreeCube(container, size);
    console.log(`Three.js ${size}x${size} cube initialized successfully`);
  } catch (error) {
    console.error("Failed to initialize Three.js cube:", error);
    // Show legacy CSS cube as fallback
    const legacyCube = document.querySelector(".cube");
    if (legacyCube) {
      legacyCube.classList.remove("hide");
    }
    container.style.display = "none";
  }
};

// Applies a clockwise face turn to the cube state and plane view.
export const applyTurn = (index, face) => {
  if (index === undefined || !face) return;

  const faceColorArray = [];
  for (let i = 0; i < FACE_ARRAY.length; i += 1) {
    const elementId = `${face}${FACE_ARRAY[i]}`;
    faceColorArray.push(getPartColor(elementId));
  }

  for (let i = 0; i < FACE_ARRAY.length; i += 1) {
    const elementId = `${face}${FACE_ARRAY[i]}`;
    const color = faceColorArray[(i + 2) % FACE_ARRAY.length];
    const el = getElement(elementId);
    const xel = getElement(`x${elementId}`);
    if (el && color) el.style.backgroundColor = color;
    if (xel && color) xel.style.backgroundColor = color;
  }

  if (!SIDE_ARRAY[index]) return;

  const sideColorArray = [];
  for (let i = 0; i < SIDE_ARRAY[index].length; i += 1) {
    sideColorArray.push(getPartColor(SIDE_ARRAY[index][i]));
  }

  for (let i = 0; i < SIDE_ARRAY[index].length; i += 1) {
    const color = sideColorArray[(i + 3) % SIDE_ARRAY[index].length];
    const el = getElement(SIDE_ARRAY[index][i]);
    const xel = getElement(`x${SIDE_ARRAY[index][i]}`);
    if (el && color) el.style.backgroundColor = color;
    if (xel && color) xel.style.backgroundColor = color;
  }

  syncPreview();
};

export const rotateFace = (key) => {
  const finalMove =
    TRANSLATION_MATRIX[DIRECTION_INDEX.get(key)][cubeState.currentState];
  applyTurn(DIRECTION_INDEX.get(finalMove), finalMove);

  // Animate Three.js cube (clockwise)
  if (threeCube) {
    threeRotateFace(finalMove.toLowerCase(), false);
  }
};

export const rotateFacePrime = (key) => {
  const normalizedKey = key.toLowerCase();
  const finalMove =
    TRANSLATION_MATRIX[DIRECTION_INDEX.get(normalizedKey)][cubeState.currentState];
  for (let i = 0; i < 3; i += 1) {
    applyTurn(DIRECTION_INDEX.get(finalMove), finalMove);
  }

  // Animate Three.js cube (counter-clockwise / prime)
  if (threeCube) {
    threeRotateFace(finalMove.toLowerCase(), true);
  }
};

export const rotateCube = (directionIndex) => {
  const cube = document.querySelector(".cube");
  if (cube) {
    cube.classList.remove(cubeState.currentClass);
    cubeState.currentClass = `s${cubeState.currentState}${directionIndex + 1}`;
    cube.classList.add(cubeState.currentClass);
  }
  cubeState.currentState = STATE_MAP[cubeState.currentState][directionIndex];

  // Rotate Three.js cube view
  if (threeCube) {
    const rotations = [
      { axis: 'y', angle: Math.PI / 6 },   // left
      { axis: 'x', angle: -Math.PI / 6 },  // up
      { axis: 'y', angle: -Math.PI / 6 },  // right
      { axis: 'x', angle: Math.PI / 6 },   // down
    ];
    const { axis, angle } = rotations[directionIndex];
    rotateCubeView(axis, angle);
  }
};

export const toggleView = () => {
  const threeCubeContainer = document.getElementById("three-cube-container");
  const planeCube = document.querySelector(".plane-cube");

  if (threeCubeContainer && planeCube) {
    threeCubeContainer.classList.toggle("hide");
    planeCube.classList.toggle("hide");
  }
};

export const resetCube = () => {
  const faceColors = getFaceColors();
  for (let i = 0; i < DIRECTIONS.length; i += 1) {
    document
      .querySelectorAll(`.${DIRECTIONS[i]} .part`)
      .forEach((piece) => {
        piece.style.backgroundColor = faceColors[i];
      });
  }

  const sequence = document.getElementById("seq");
  if (sequence) {
    sequence.textContent = "\u00A0";
  }

  const cube = document.querySelector(".cube");
  if (cube) {
    cube.classList.remove(cubeState.currentClass);
    cubeState.currentClass = "s23";
    cube.classList.add(cubeState.currentClass);
  }
  cubeState.currentState = 1;

  // Reset Three.js cube
  if (threeCube) {
    threeResetCube();
  }

  syncPreview();
};

/**
 * Apply a scramble sequence to the Three.js cube instantly
 */
export const applyScrambleToThreeCube = (sequence) => {
  if (threeCube) {
    threeApplyScramble(sequence);
  }
};

/**
 * Rebuild the Three.js cube with a new size
 */
export const rebuildThreeCube = () => {
  if (threeCube) {
    const size = getCubeSize();
    rebuildCube(size);
    console.log(`Three.js cube rebuilt as ${size}x${size}`);
  }
};

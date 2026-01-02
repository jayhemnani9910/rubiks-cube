/**
 * Dynamic Cube Rendering System
 * Supports 2x2 through 7x7 cubes with proper move application
 */

import { getState } from "./storage.js";

// Face names in standard order
export const FACES = ["right", "left", "up", "down", "front", "back"];
export const FACE_LETTERS = ["r", "l", "u", "d", "f", "b"];

// Current cube state (logical representation)
let cubeSize = 3;
let cubeColors = null; // 6 faces, each NxN array of colors

/**
 * Get the current cube size from settings
 */
export const getCubeSize = () => {
  const cubeType = getState().settings.cubeType ?? "3x3";
  return parseInt(cubeType.split("x")[0], 10) || 3;
};

/**
 * Initialize cube colors to solved state
 */
export const initCubeColors = (size) => {
  cubeSize = size;
  const faceColors = getFaceColorsFromCSS();
  cubeColors = {};

  FACE_LETTERS.forEach((face, index) => {
    cubeColors[face] = [];
    for (let i = 0; i < size * size; i++) {
      cubeColors[face].push(faceColors[index]);
    }
  });

  return cubeColors;
};

/**
 * Get face colors from CSS variables
 */
const getFaceColorsFromCSS = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  return FACES.map((direction) =>
    rootStyles.getPropertyValue(`--face-${direction}`).trim()
  );
};

/**
 * Get piece index from row and column (0-indexed)
 */
const getIndex = (row, col, size) => row * size + col;

/**
 * Get row and column from index
 */
const getRowCol = (index, size) => ({
  row: Math.floor(index / size),
  col: index % size,
});

/**
 * Rotate a face clockwise (just the face, not the sides)
 * For a 90-degree clockwise rotation:
 * new[col][size-1-row] = old[row][col]
 */
const rotateFaceClockwise = (faceArray, size) => {
  const newFace = [...faceArray];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const oldIndex = getIndex(row, col, size);
      const newIndex = getIndex(col, size - 1 - row, size);
      newFace[newIndex] = faceArray[oldIndex];
    }
  }
  return newFace;
};

/**
 * Rotate a face counter-clockwise (3 clockwise rotations)
 */
const rotateFaceCounterClockwise = (faceArray, size) => {
  let result = faceArray;
  for (let i = 0; i < 3; i++) {
    result = rotateFaceClockwise(result, size);
  }
  return result;
};

/**
 * Get the indices of a row from a face
 */
const getRow = (row, size) => {
  const indices = [];
  for (let col = 0; col < size; col++) {
    indices.push(getIndex(row, col, size));
  }
  return indices;
};

/**
 * Get the indices of a column from a face
 */
const getCol = (col, size) => {
  const indices = [];
  for (let row = 0; row < size; row++) {
    indices.push(getIndex(row, col, size));
  }
  return indices;
};

/**
 * Get side pieces affected by a face turn
 * Returns arrays of [face, indices, reversed] for the 4 adjacent faces
 */
const getSideEffects = (face, depth, size) => {
  // depth: 0 = outer layer, 1 = second layer, etc.
  const d = depth;

  const effects = {
    r: [
      { face: "u", indices: getCol(size - 1 - d, size), reverse: false },
      { face: "b", indices: getCol(d, size), reverse: true },
      { face: "d", indices: getCol(size - 1 - d, size), reverse: false },
      { face: "f", indices: getCol(size - 1 - d, size), reverse: false },
    ],
    l: [
      { face: "u", indices: getCol(d, size), reverse: false },
      { face: "f", indices: getCol(d, size), reverse: false },
      { face: "d", indices: getCol(d, size), reverse: false },
      { face: "b", indices: getCol(size - 1 - d, size), reverse: true },
    ],
    u: [
      { face: "f", indices: getRow(d, size), reverse: false },
      { face: "l", indices: getRow(d, size), reverse: false },
      { face: "b", indices: getRow(d, size), reverse: false },
      { face: "r", indices: getRow(d, size), reverse: false },
    ],
    d: [
      { face: "f", indices: getRow(size - 1 - d, size), reverse: false },
      { face: "r", indices: getRow(size - 1 - d, size), reverse: false },
      { face: "b", indices: getRow(size - 1 - d, size), reverse: false },
      { face: "l", indices: getRow(size - 1 - d, size), reverse: false },
    ],
    f: [
      { face: "u", indices: getRow(size - 1 - d, size), reverse: false },
      { face: "r", indices: getCol(d, size), reverse: true },
      { face: "d", indices: getRow(d, size), reverse: false },
      { face: "l", indices: getCol(size - 1 - d, size), reverse: true },
    ],
    b: [
      { face: "u", indices: getRow(d, size), reverse: true },
      { face: "l", indices: getCol(d, size), reverse: false },
      { face: "d", indices: getRow(size - 1 - d, size), reverse: true },
      { face: "r", indices: getCol(size - 1 - d, size), reverse: false },
    ],
  };

  return effects[face];
};

/**
 * Apply a single clockwise turn to the cube state
 * face: 'r', 'l', 'u', 'd', 'f', 'b'
 * depth: 0 for outer layer, 1+ for inner layers (wide moves)
 */
export const applyTurnToState = (face, depth = 0) => {
  if (!cubeColors) {
    initCubeColors(getCubeSize());
  }

  const size = cubeSize;

  // Only rotate the face itself if it's the outer layer (depth 0)
  if (depth === 0) {
    cubeColors[face] = rotateFaceClockwise(cubeColors[face], size);
  }

  // Get side effects for this layer
  const effects = getSideEffects(face, depth, size);

  // Collect current values from all 4 sides
  const values = effects.map(({ face: f, indices, reverse }) => {
    let vals = indices.map((i) => cubeColors[f][i]);
    if (reverse) vals = vals.reverse();
    return vals;
  });

  // Cycle the values clockwise (each face gets the previous face's values)
  effects.forEach(({ face: f, indices, reverse }, i) => {
    const prevValues = values[(i + 3) % 4]; // Get from previous face
    let toApply = reverse ? [...prevValues].reverse() : prevValues;
    indices.forEach((idx, j) => {
      cubeColors[f][idx] = toApply[j];
    });
  });
};

/**
 * Apply a move token (e.g., "R", "R'", "R2", "Rw", "3Rw'")
 */
export const applyMoveToState = (token) => {
  // Parse the token
  const match = token.match(/^(\d)?([RLUDFB])([w])?([2'])?$/i);
  if (!match) return;

  const [, depthStr, faceChar, wide, modifier] = match;
  const face = faceChar.toLowerCase();
  const depth = wide ? (parseInt(depthStr, 10) || 2) - 1 : 0;
  const turns = modifier === "2" ? 2 : modifier === "'" ? 3 : 1;

  // Apply the turn(s)
  for (let t = 0; t < turns; t++) {
    // For wide moves, apply to multiple layers
    for (let d = 0; d <= depth; d++) {
      applyTurnToState(face, d);
    }
  }
};

/**
 * Get the current color of a piece
 */
export const getPieceColor = (face, index) => {
  if (!cubeColors || !cubeColors[face]) return null;
  return cubeColors[face][index];
};

/**
 * Reset cube to solved state
 */
export const resetCubeState = () => {
  const size = getCubeSize();
  initCubeColors(size);
};

/**
 * Generate DOM for the 3D cube
 */
export const generateCubeDOM = (container, size) => {
  if (!container) return;

  container.innerHTML = "";

  FACES.forEach((faceName) => {
    const faceDiv = document.createElement("div");
    faceDiv.className = faceName;

    const letter = faceName[0];
    for (let i = 0; i < size * size; i++) {
      const part = document.createElement("div");
      part.className = "part";
      part.id = `${letter}${i + 1}`;
      part.dataset.face = letter;
      part.dataset.index = i;
      faceDiv.appendChild(part);
    }

    container.appendChild(faceDiv);
  });

  // Update CSS grid for the size
  container.style.setProperty("--cube-size", size);
};

/**
 * Generate DOM for the 2D plane cube
 */
export const generatePlaneCubeDOM = (container, size) => {
  if (!container) return;

  container.innerHTML = "";

  FACES.forEach((faceName) => {
    const faceDiv = document.createElement("div");
    faceDiv.className = faceName;

    const letter = faceName[0];
    for (let i = 0; i < size * size; i++) {
      const part = document.createElement("div");
      part.className = "part";
      part.id = `x${letter}${i + 1}`;
      part.dataset.face = letter;
      part.dataset.index = i;
      faceDiv.appendChild(part);
    }

    container.appendChild(faceDiv);
  });

  container.style.setProperty("--cube-size", size);
};

/**
 * Generate DOM for the preview panel
 */
export const generatePreviewDOM = (container, size) => {
  if (!container) return;

  container.innerHTML = "";

  const faceOrder = ["up", "left", "front", "right", "back", "down"];

  faceOrder.forEach((faceName) => {
    const faceDiv = document.createElement("div");
    faceDiv.className = `preview-face preview-${faceName}`;

    const letter = faceName[0];
    for (let i = 0; i < size * size; i++) {
      const span = document.createElement("span");
      span.dataset.piece = `${letter}${i + 1}`;
      span.dataset.face = letter;
      span.dataset.index = i;
      faceDiv.appendChild(span);
    }

    container.appendChild(faceDiv);
  });

  container.style.setProperty("--preview-size", size);
};

/**
 * Sync DOM colors from cube state
 */
export const syncDOMFromState = () => {
  if (!cubeColors) return;

  FACE_LETTERS.forEach((face) => {
    cubeColors[face].forEach((color, index) => {
      const id = `${face}${index + 1}`;

      // 3D cube
      const el = document.getElementById(id);
      if (el && color) el.style.backgroundColor = color;

      // 2D plane
      const xel = document.getElementById(`x${id}`);
      if (xel && color) xel.style.backgroundColor = color;
    });
  });
};

/**
 * Sync preview panel from cube state
 */
export const syncPreviewFromState = () => {
  if (!cubeColors) return;

  const previewNet = document.getElementById("preview-net");
  if (!previewNet) return;

  const cells = previewNet.querySelectorAll("[data-piece]");
  cells.forEach((cell) => {
    const piece = cell.dataset.piece;
    if (!piece) return;

    const face = piece[0];
    const index = parseInt(piece.slice(1), 10) - 1;

    if (cubeColors[face] && cubeColors[face][index]) {
      cell.style.backgroundColor = cubeColors[face][index];
    }
  });
};

/**
 * Get the current cube size
 */
export const getCurrentSize = () => cubeSize;

/**
 * Check if current cube type supports visualization
 */
export const supportsVisualization = () => {
  const size = getCubeSize();
  return size >= 2 && size <= 7;
};

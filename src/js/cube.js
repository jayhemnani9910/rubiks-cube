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

const getElement = (id) => document.getElementById(id);
const getPartColor = (id) =>
  window.getComputedStyle(getElement(id)).getPropertyValue("background-color");

// Applies a clockwise face turn to the cube state and plane view.
export const applyTurn = (index, face) => {
  const faceColorArray = [];
  for (let i = 0; i < FACE_ARRAY.length; i += 1) {
    const elementId = `${face}${FACE_ARRAY[i]}`;
    faceColorArray.push(getPartColor(elementId));
  }

  for (let i = 0; i < FACE_ARRAY.length; i += 1) {
    const elementId = `${face}${FACE_ARRAY[i]}`;
    const color = faceColorArray[(i + 2) % FACE_ARRAY.length];
    getElement(elementId).style.backgroundColor = color;
    getElement(`x${elementId}`).style.backgroundColor = color;
  }

  const sideColorArray = [];
  for (let i = 0; i < SIDE_ARRAY[index].length; i += 1) {
    sideColorArray.push(getPartColor(SIDE_ARRAY[index][i]));
  }

  for (let i = 0; i < SIDE_ARRAY[index].length; i += 1) {
    const color = sideColorArray[(i + 3) % SIDE_ARRAY[index].length];
    getElement(SIDE_ARRAY[index][i]).style.backgroundColor = color;
    getElement(`x${SIDE_ARRAY[index][i]}`).style.backgroundColor = color;
  }
};

export const rotateFace = (key) => {
  const finalMove =
    TRANSLATION_MATRIX[DIRECTION_INDEX.get(key)][cubeState.currentState];
  applyTurn(DIRECTION_INDEX.get(finalMove), finalMove);
};

export const rotateFacePrime = (key) => {
  const normalizedKey = key.toLowerCase();
  const finalMove =
    TRANSLATION_MATRIX[DIRECTION_INDEX.get(normalizedKey)][cubeState.currentState];
  for (let i = 0; i < 3; i += 1) {
    applyTurn(DIRECTION_INDEX.get(finalMove), finalMove);
  }
};

export const rotateCube = (directionIndex) => {
  const cube = document.querySelector(".cube");
  cube.classList.remove(cubeState.currentClass);
  cubeState.currentClass = `s${cubeState.currentState}${directionIndex + 1}`;
  cube.classList.add(cubeState.currentClass);
  cubeState.currentState = STATE_MAP[cubeState.currentState][directionIndex];
};

export const toggleView = () => {
  document.querySelector(".cube").classList.toggle("hide");
  document.querySelector(".plane-cube").classList.toggle("hide");
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
  cube.classList.remove(cubeState.currentClass);
  cubeState.currentClass = "s23";
  cube.classList.add(cubeState.currentClass);
  cubeState.currentState = 1;
};

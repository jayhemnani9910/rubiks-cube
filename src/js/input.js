import {
  rotateFace,
  rotateFacePrime,
  rotateCube,
  toggleView,
  resetCube,
} from "./cube.js";
import { generateScramble } from "./scramble.js";
import { cubeState } from "./state.js";
import { toggleTimer, resetTimer, isTimerActive } from "./timer.js";

const CUBE_ROTATION_KEYS = {
  ArrowLeft: 0,
  ArrowUp: 1,
  ArrowRight: 2,
  ArrowDown: 3,
};

const RANDOM_KEYS = [
  "ArrowLeft",
  "ArrowUp",
  "ArrowRight",
  "ArrowDown",
  "r",
  "l",
  "u",
  "d",
  "f",
  "b",
  "R",
  "L",
  "U",
  "D",
  "F",
  "B",
];

export const startAnimation = () => {
  if (cubeState.animationId) {
    return;
  }

  cubeState.animationId = setInterval(() => {
    const key = RANDOM_KEYS[Math.floor(Math.random() * RANDOM_KEYS.length)];
    handleInput(key);
  }, 400);
};

export const stopAnimation = () => {
  if (!cubeState.animationId) {
    return;
  }

  clearInterval(cubeState.animationId);
  cubeState.animationId = null;
};

export const handleInput = (eventKey) => {
  if (eventKey === " " || eventKey === "Spacebar") {
    toggleTimer();
    return;
  }

  if (eventKey === "Escape" || eventKey === "Esc") {
    resetTimer();
    return;
  }

  if (isTimerActive()) {
    return;
  }

  if (eventKey in CUBE_ROTATION_KEYS) {
    rotateCube(CUBE_ROTATION_KEYS[eventKey]);
    return;
  }

  switch (eventKey) {
    case "r":
    case "l":
    case "u":
    case "d":
    case "f":
    case "b":
      rotateFace(eventKey);
      break;
    case "R":
    case "L":
    case "U":
    case "D":
    case "F":
    case "B":
      rotateFacePrime(eventKey);
      break;
    case "g":
      generateScramble();
      break;
    case "z":
      resetCube();
      break;
    case "v":
      toggleView();
      break;
    case "a":
      startAnimation();
      break;
    case "A":
      stopAnimation();
      break;
    default:
      break;
  }
};

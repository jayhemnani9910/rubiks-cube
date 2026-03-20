import {
  rotateFace,
  rotateFacePrime,
  rotateCube,
  resetCube,
} from "./cube.js";
import { generateScramble } from "./scramble.js";
import { toggleTimer, resetTimer, isTimerActive } from "./timer.js";
import { isAnyPanelOpen } from "./panels.js";

const CUBE_ROTATION_KEYS = {
  ArrowLeft: 0,
  ArrowUp: 1,
  ArrowRight: 2,
  ArrowDown: 3,
};

export const handleInput = (eventKey) => {
  if (eventKey === " " || eventKey === "Spacebar") {
    toggleTimer();
    return;
  }

  if (eventKey === "Escape" || eventKey === "Esc") {
    if (!isAnyPanelOpen()) {
      resetTimer();
    }
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
    default:
      break;
  }
};

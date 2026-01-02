import { handleInput, startAnimation, stopAnimation } from "./input.js";
import {
  rotateFace,
  rotateFacePrime,
  rotateCube,
  toggleView,
  resetCube,
  initCube,
} from "./cube.js";
import { generateScramble } from "./scramble.js";
import { initTimer } from "./timer.js";
import { initSettings } from "./settings.js";
import { bindHistory, renderSolves } from "./history.js";
import { renderStats } from "./stats.js";
import { initCharts, renderCharts } from "./charts.js";
import { initSessions } from "./sessions.js";
import { initIO } from "./io.js";
import { initPwa } from "./pwa.js";
import { initPreview } from "./preview.js";
import { initLeaderboard } from "./leaderboard.js";
import { initTutorial } from "./tutorial.js";
import { initOnboarding } from "./onboarding.js";
import { initSolver } from "./solver.js";

const CUBE_TURN_INDEX = {
  left: 0,
  up: 1,
  right: 2,
  down: 3,
};

document.addEventListener("keydown", (event) => {
  const tagName = event.target.tagName;
  if (tagName === "INPUT" || tagName === "SELECT" || tagName === "TEXTAREA") {
    return;
  }
  if (event.key.startsWith("Arrow") || event.code === "Space") {
    event.preventDefault();
  }
  handleInput(event.key);
});

document.querySelectorAll(".face-btn button").forEach((button) => {
  button.addEventListener("click", () => {
    rotateFace(button.classList[0][0]);
  });
});

document.querySelectorAll(".face-prime-btn button").forEach((button) => {
  button.addEventListener("click", () => {
    rotateFacePrime(button.classList[0][0]);
  });
});

document.querySelectorAll(".cube-turn").forEach((button) => {
  const direction = Object.keys(CUBE_TURN_INDEX).find((key) =>
    button.classList.contains(key)
  );
  if (!direction) {
    return;
  }

  button.addEventListener("click", () => {
    rotateCube(CUBE_TURN_INDEX[direction]);
  });
});

document.querySelector(".generate").addEventListener("click", generateScramble);
document.querySelector(".reset").addEventListener("click", resetCube);
document.querySelector(".view").addEventListener("click", toggleView);
document
  .querySelector(".start-animation")
  .addEventListener("click", startAnimation);
document
  .querySelector(".stop-animation")
  .addEventListener("click", stopAnimation);

initTimer({
  onSolve: () => {
    renderSolves();
    renderStats();
    renderCharts();
  },
});
bindHistory();
initSettings();
initSessions();
initIO();
initPwa();
initPreview();
initLeaderboard();
initTutorial();
initOnboarding();
initSolver();
renderSolves();
renderStats();
initCharts();
renderCharts();

// Initialize Three.js 3D cube
initCube();

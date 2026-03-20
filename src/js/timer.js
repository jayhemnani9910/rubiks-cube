import { addSolve, getState, getActiveSolves, updateSettings } from "./storage.js";
import { createId, formatTime, applyPenalty, EMPTY_SCRAMBLE } from "./utils.js";
import { getCubeConfig } from "./cubes.js";
import { playStartSound, playStopSound } from "./sound.js";

let timerRunning = false;
let timerStart = 0;
let elapsed = 0;
let timerFrame = null;
let lastDisplayUpdate = 0;
const DISPLAY_INTERVAL = 33; // ~30fps throttle for timer text updates

let inspectionActive = false;
let inspectionStart = 0;
let inspectionFrame = null;
let inspectionPenalty = "ok";

let onSolveCallback = null;

const timerDisplay = () => document.getElementById("timer");
const inspectionDisplay = () => document.getElementById("inspection");
const timerToggleButton = () => document.querySelector(".timer-toggle");
const timerResetButton = () => document.querySelector(".timer-reset");

const updateTimerDisplay = () => {
  const display = timerDisplay();
  if (!display) {
    return;
  }

  const precision = getState().settings.precision;
  display.textContent = formatTime(elapsed, precision);
};

const updateTimerDisplayWithPenalty = (penalty) => {
  const display = timerDisplay();
  if (!display) {
    return;
  }

  if (penalty === "dnf") {
    display.textContent = "DNF";
    return;
  }

  const precision = getState().settings.precision;
  const adjusted = penalty === "plus2" ? elapsed + 2000 : elapsed;
  display.textContent = formatTime(adjusted, precision);
};

const updateInspectionDisplay = () => {
  const display = inspectionDisplay();
  if (!display) {
    return;
  }

  const elapsedSeconds = (performance.now() - inspectionStart) / 1000;
  const inspectionSeconds =
    getCubeConfig(getState().settings.cubeType).inspectionSeconds ?? 15;
  const remaining = inspectionSeconds - elapsedSeconds;

  if (remaining >= 0) {
    display.textContent = `Inspection ${remaining.toFixed(1)}s`;
    display.classList.remove("inspection-over");
  } else if (elapsedSeconds < inspectionSeconds + 2) {
    display.textContent = `+2 (${Math.abs(remaining).toFixed(1)}s)`;
    display.classList.add("inspection-over");
  } else {
    display.textContent = "DNF";
    display.classList.add("inspection-over");
  }
};

const animateTimer = () => {
  elapsed = performance.now() - timerStart;
  const now = performance.now();
  if (now - lastDisplayUpdate >= DISPLAY_INTERVAL) {
    updateTimerDisplay();
    lastDisplayUpdate = now;
  }
  timerFrame = requestAnimationFrame(animateTimer);
};

const animateInspection = () => {
  updateInspectionDisplay();
  inspectionFrame = requestAnimationFrame(animateInspection);
};

const stopInspection = () => {
  if (!inspectionActive) {
    return "ok";
  }

  const elapsedSeconds = (performance.now() - inspectionStart) / 1000;
  const inspectionSeconds =
    getCubeConfig(getState().settings.cubeType).inspectionSeconds ?? 15;
  inspectionPenalty = "ok";
  if (elapsedSeconds > inspectionSeconds + 2) {
    inspectionPenalty = "dnf";
  } else if (elapsedSeconds > inspectionSeconds) {
    inspectionPenalty = "plus2";
  }

  inspectionActive = false;
  if (inspectionFrame) {
    cancelAnimationFrame(inspectionFrame);
  }

  const display = inspectionDisplay();
  if (display) {
    display.classList.add("hide");
  }

  return inspectionPenalty;
};

export const startTimer = () => {
  timerRunning = true;
  timerStart = performance.now() - elapsed;
  lastDisplayUpdate = 0;
  timerFrame = requestAnimationFrame(animateTimer);
  document.body.classList.add("timing");
  playStartSound();
};

export const stopTimer = () => {
  timerRunning = false;
  document.body.classList.remove("timing");
  if (timerFrame) {
    cancelAnimationFrame(timerFrame);
  }
  updateTimerDisplayWithPenalty(inspectionPenalty);
  playStopSound();

  const scramble = document.getElementById("seq")?.textContent?.trim();
  const solveTime = Math.round(elapsed);
  const solve = {
    id: createId(),
    timeMs: solveTime,
    penalty: inspectionPenalty,
    scramble: scramble && scramble !== EMPTY_SCRAMBLE ? scramble : "",
    cubeType: getState().settings.cubeType,
    sessionId: getState().settings.sessionId,
    createdAt: new Date().toISOString(),
  };

  // Check for PB before adding solve
  const existingSolves = getActiveSolves();
  const existingTimes = existingSolves
    .map((s) => applyPenalty(s))
    .filter((v) => v !== null);
  const currentBest = existingTimes.length ? Math.min(...existingTimes) : Infinity;
  const solveAdjusted = applyPenalty(solve);

  addSolve(solve);

  // Visual feedback
  const display = timerDisplay();
  if (display) {
    display.classList.add("timer-flash");
    setTimeout(() => display.classList.remove("timer-flash"), 300);

    if (solveAdjusted !== null && solveAdjusted < currentBest) {
      display.classList.add("timer-pb");
      setTimeout(() => display.classList.remove("timer-pb"), 1500);
    }
  }

  if (typeof onSolveCallback === "function") {
    onSolveCallback(solve);
  }

  inspectionPenalty = "ok";
};

export const resetTimer = () => {
  timerRunning = false;
  elapsed = 0;
  inspectionPenalty = "ok";

  if (timerFrame) {
    cancelAnimationFrame(timerFrame);
  }
  if (inspectionFrame) {
    cancelAnimationFrame(inspectionFrame);
  }

  inspectionActive = false;
  updateTimerDisplay();

  const display = inspectionDisplay();
  if (display) {
    display.classList.add("hide");
  }
};

export const toggleTimer = () => {
  if (timerRunning) {
    stopTimer();
    return;
  }

  const { inspectionEnabled } = getState().settings;
  if (inspectionEnabled) {
    if (!inspectionActive) {
      elapsed = 0;
      inspectionActive = true;
      inspectionPenalty = "ok";
      inspectionStart = performance.now();
      const display = inspectionDisplay();
      if (display) {
        display.classList.remove("hide");
      }
      inspectionFrame = requestAnimationFrame(animateInspection);
      return;
    }

    inspectionPenalty = stopInspection();
  } else {
    inspectionPenalty = "ok";
  }

  elapsed = 0;
  startTimer();
};

export const isTimerActive = () => timerRunning || inspectionActive;

export const setInspectionEnabled = (enabled) => {
  updateSettings({ inspectionEnabled: enabled });
  if (!enabled && inspectionActive) {
    stopInspection();
  }
};

export const refreshTimer = () => {
  updateTimerDisplay();
};

export const initTimer = ({ onSolve } = {}) => {
  onSolveCallback = onSolve ?? null;
  updateTimerDisplay();

  const toggleButton = timerToggleButton();
  if (toggleButton) {
    toggleButton.addEventListener("click", toggleTimer);
  }

  const resetButton = timerResetButton();
  if (resetButton) {
    resetButton.addEventListener("click", resetTimer);
  }
};

import { addSolve, getState, updateSettings } from "./storage.js";
import { createId, formatTime } from "./utils.js";

const INSPECTION_LIMIT_SECONDS = 15;
const INSPECTION_DNF_SECONDS = 17;

let timerRunning = false;
let timerStart = 0;
let elapsed = 0;
let timerFrame = null;

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
  const remaining = INSPECTION_LIMIT_SECONDS - elapsedSeconds;

  if (remaining >= 0) {
    display.textContent = `Inspection ${remaining.toFixed(1)}s`;
    display.classList.remove("inspection-over");
  } else if (elapsedSeconds < INSPECTION_DNF_SECONDS) {
    display.textContent = `+2 (${Math.abs(remaining).toFixed(1)}s)`;
    display.classList.add("inspection-over");
  } else {
    display.textContent = "DNF";
    display.classList.add("inspection-over");
  }
};

const animateTimer = () => {
  elapsed = performance.now() - timerStart;
  updateTimerDisplay();
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
  inspectionPenalty = "ok";
  if (elapsedSeconds > INSPECTION_DNF_SECONDS) {
    inspectionPenalty = "dnf";
  } else if (elapsedSeconds > INSPECTION_LIMIT_SECONDS) {
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
  timerFrame = requestAnimationFrame(animateTimer);
};

export const stopTimer = () => {
  timerRunning = false;
  if (timerFrame) {
    cancelAnimationFrame(timerFrame);
  }
  updateTimerDisplayWithPenalty(inspectionPenalty);

  const scramble = document.getElementById("seq")?.textContent?.trim();
  const solve = {
    id: createId(),
    timeMs: Math.round(elapsed),
    penalty: inspectionPenalty,
    scramble: scramble && scramble !== "\u00A0" ? scramble : "",
    cubeType: getState().settings.cubeType,
    sessionId: getState().settings.sessionId,
    createdAt: new Date().toISOString(),
  };

  addSolve(solve);

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

import { updateTutorial, getState } from "./storage.js";
import { rotateFace, rotateFacePrime, resetCube } from "./cube.js";

const modal = () => document.getElementById("tutorial-modal");
const openButton = () => document.getElementById("tutorial-open");
const closeButton = () => document.getElementById("tutorial-close");
const listContainer = () => document.getElementById("tutorial-list");
const title = () => document.getElementById("tutorial-title");
const stepLabel = () => document.getElementById("tutorial-step");
const stepTitle = () => document.getElementById("tutorial-step-title");
const stepText = () => document.getElementById("tutorial-step-text");
const movesText = () => document.getElementById("tutorial-moves");
const playButton = () => document.getElementById("tutorial-play");
const prevButton = () => document.getElementById("tutorial-prev");
const nextButton = () => document.getElementById("tutorial-next");
const completeButton = () => document.getElementById("tutorial-complete");
const onboarding = () => document.getElementById("onboarding");

let lessons = [];
let lessonIndex = 0;
let stepIndex = 0;
let demoRunning = false;

const setPlayState = (running) => {
  const button = playButton();
  if (!button) {
    return;
  }
  button.disabled = running;
  button.textContent = running ? "Playing..." : "Play demo";
};

const flashComplete = () => {
  const button = completeButton();
  if (!button) {
    return;
  }
  const label = button.textContent;
  button.textContent = "Completed";
  setTimeout(() => {
    button.textContent = label;
  }, 800);
};

const parseMoves = (moves) =>
  moves
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const runMove = (token) => {
  if (token.toLowerCase() === "z") {
    resetCube();
    return;
  }

  const base = token[0];
  const isPrime = token.includes("'");
  const isDouble = token.includes("2");

  if (isPrime) {
    rotateFacePrime(base);
  } else {
    rotateFace(base.toLowerCase());
  }

  if (isDouble) {
    if (isPrime) {
      rotateFacePrime(base);
    } else {
      rotateFace(base.toLowerCase());
    }
  }
};

const playMoves = async () => {
  if (demoRunning) {
    return;
  }

  const moves = lessons[lessonIndex]?.steps?.[stepIndex]?.moves;
  if (!moves) {
    return;
  }

  demoRunning = true;
  setPlayState(true);
  const tokens = parseMoves(moves);
  for (const token of tokens) {
    runMove(token);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  demoRunning = false;
  setPlayState(false);
};

const renderLessonList = () => {
  const list = listContainer();
  if (!list) {
    return;
  }

  const completed = getState().tutorial.completed ?? {};
  list.innerHTML = "";
  lessons.forEach((lesson, index) => {
    const item = document.createElement("div");
    item.className = "tutorial-item";
    if (index === lessonIndex) {
      item.classList.add("active");
    }
    if (completed[lesson.id]) {
      item.classList.add("completed");
    }
    item.textContent = lesson.title;
    item.addEventListener("click", () => {
      lessonIndex = index;
      stepIndex = 0;
      renderTutorial();
    });
    list.append(item);
  });
};

const renderTutorial = () => {
  const lesson = lessons[lessonIndex];
  const step = lesson?.steps?.[stepIndex];
  if (!lesson || !step) {
    return;
  }

  if (title()) title().textContent = lesson.title;
  if (stepLabel()) stepLabel().textContent = `Step ${stepIndex + 1} of ${lesson.steps.length}`;
  if (stepTitle()) stepTitle().textContent = step.title;
  if (stepText()) stepText().textContent = step.text;
  if (movesText()) movesText().textContent = step.moves ?? "";

  renderLessonList();
};

const openTutorial = () => {
  const overlay = modal();
  if (!overlay) {
    return;
  }
  const onboardingOverlay = onboarding();
  if (onboardingOverlay && !onboardingOverlay.classList.contains("hide")) {
    onboardingOverlay.classList.add("hide");
    updateTutorial({ onboardingSeen: true });
  }
  overlay.classList.remove("hide");
  renderTutorial();
};

const closeTutorial = () => {
  const overlay = modal();
  if (overlay) {
    overlay.classList.add("hide");
  }
  try {
    updateTutorial({ lastLessonId: lessons[lessonIndex]?.id ?? null });
  } catch (error) {
    console.warn("Failed to persist tutorial state.", error);
  }
};

const closeOnBackdrop = (event) => {
  if (event.target === modal()) {
    closeTutorial();
  }
};

const closeOnEscape = (event) => {
  if (event.key !== "Escape") {
    return;
  }
  const overlay = modal();
  if (!overlay || overlay.classList.contains("hide")) {
    return;
  }
  closeTutorial();
};

const loadTutorial = async () => {
  try {
    const response = await fetch("./data/tutorial.json", { cache: "no-store" });
    const data = await response.json();
    lessons = data.lessons ?? [];
  } catch (error) {
    console.warn("Failed to load tutorial data.", error);
    lessons = [];
  }
};

export const initTutorial = async () => {
  // Attach close handlers FIRST (before any async operations)
  // This ensures users can always close the modal even if content fails to load
  openButton()?.addEventListener("click", openTutorial);
  closeButton()?.addEventListener("click", closeTutorial);
  modal()?.addEventListener("click", closeOnBackdrop);
  document.addEventListener("keydown", closeOnEscape);

  await loadTutorial();
  if (!lessons.length) {
    // Hide modal if it was somehow left open with no content
    modal()?.classList.add("hide");
    return;
  }

  const lastLessonId = getState().tutorial.lastLessonId;
  if (lastLessonId) {
    const index = lessons.findIndex((lesson) => lesson.id === lastLessonId);
    if (index >= 0) {
      lessonIndex = index;
    }
  }

  prevButton()?.addEventListener("click", () => {
    if (stepIndex > 0) {
      stepIndex -= 1;
    } else if (lessonIndex > 0) {
      lessonIndex -= 1;
      stepIndex = 0;
    }
    renderTutorial();
  });

  nextButton()?.addEventListener("click", () => {
    const lesson = lessons[lessonIndex];
    if (stepIndex < lesson.steps.length - 1) {
      stepIndex += 1;
    } else if (lessonIndex < lessons.length - 1) {
      lessonIndex += 1;
      stepIndex = 0;
    }
    renderTutorial();
  });

  completeButton()?.addEventListener("click", () => {
    const lesson = lessons[lessonIndex];
    if (!lesson) {
      return;
    }
    try {
      updateTutorial({
        completed: {
          ...getState().tutorial.completed,
          [lesson.id]: true,
        },
      });
    } catch (error) {
      console.warn("Failed to persist tutorial completion.", error);
    }
    renderLessonList();
    flashComplete();
    closeTutorial();
  });

  playButton()?.addEventListener("click", playMoves);
  setPlayState(false);
};

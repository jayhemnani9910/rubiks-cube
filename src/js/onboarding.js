import { getState, updateTutorial } from "./storage.js";

const overlay = () => document.getElementById("onboarding");
const title = () => document.getElementById("onboarding-title");
const text = () => document.getElementById("onboarding-text");
const nextButton = () => document.getElementById("onboarding-next");
const skipButton = () => document.getElementById("onboarding-skip");

const steps = [
  {
    title: "Welcome",
    text: "Use Space to start/stop the timer. Press G to generate a scramble.",
  },
  {
    title: "Sessions",
    text: "Create sessions to separate practice sets and track stats per cube.",
  },
  {
    title: "Themes",
    text: "Switch themes or create a custom palette from Settings.",
  },
];

let index = 0;

const renderStep = () => {
  const step = steps[index];
  if (!step) {
    return;
  }
  if (title()) title().textContent = step.title;
  if (text()) text().textContent = step.text;
  if (nextButton()) {
    nextButton().textContent = index === steps.length - 1 ? "Done" : "Next";
  }
};

const close = () => {
  const el = overlay();
  if (el) {
    el.classList.add("hide");
  }
  updateTutorial({ onboardingSeen: true });
};

export const initOnboarding = () => {
  if (getState().tutorial.onboardingSeen) {
    return;
  }

  const el = overlay();
  if (!el) {
    return;
  }

  el.classList.remove("hide");
  renderStep();

  nextButton()?.addEventListener("click", () => {
    if (index < steps.length - 1) {
      index += 1;
      renderStep();
    } else {
      close();
    }
  });

  skipButton()?.addEventListener("click", close);
};

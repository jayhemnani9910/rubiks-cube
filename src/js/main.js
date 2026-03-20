import { handleInput } from "./input.js";
import { initCube } from "./cube.js";
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
import { initPanels } from "./panels.js";

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

document.querySelector(".generate")?.addEventListener("click", generateScramble);

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
initPanels();
renderSolves();
renderStats();
initCharts();
renderCharts();

initCube();

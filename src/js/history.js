import {
  getState,
  updateSolvePenalty,
  clearSolvesForSelection,
} from "./storage.js";
import { formatTime } from "./utils.js";
import { renderStats } from "./stats.js";
import { renderCharts } from "./charts.js";

const solveList = () => document.getElementById("solve-list");
const solveEmpty = () => document.getElementById("solve-empty");
const clearButton = () => document.getElementById("clear-solves");

const getDisplayTime = (solve, precision) => {
  if (solve.penalty === "dnf") {
    return "DNF";
  }

  const adjusted =
    solve.penalty === "plus2" ? solve.timeMs + 2000 : solve.timeMs;
  return formatTime(adjusted, precision);
};

export const renderSolves = () => {
  const { solves, settings } = getState();
  const list = solveList();
  const emptyState = solveEmpty();
  const clear = clearButton();
  const activeCube = settings.cubeType ?? "3x3";
  const activeSession = settings.sessionId;
  const filteredSolves = solves.filter(
    (solve) =>
      (solve.cubeType ?? "3x3") === activeCube &&
      solve.sessionId === activeSession
  );

  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (!filteredSolves.length) {
    if (emptyState) {
      emptyState.classList.remove("hide");
    }
    if (clear) {
      clear.classList.add("hide");
    }
    return;
  }

  if (emptyState) {
    emptyState.classList.add("hide");
  }
  if (clear) {
    clear.classList.remove("hide");
  }

  filteredSolves.forEach((solve, index) => {
    const item = document.createElement("li");
    item.className = "solve-item";
    item.dataset.solveId = solve.id;

    const header = document.createElement("div");
    header.className = "solve-row";

    const label = document.createElement("span");
    label.className = "solve-index";
    label.textContent = `#${index + 1}`;

    const time = document.createElement("span");
    time.className = "solve-time";
    time.textContent = getDisplayTime(solve, settings.precision);
    time.title = formatTime(solve.timeMs, settings.precision);

    const penaltySelect = document.createElement("select");
    penaltySelect.className = "solve-penalty";
    penaltySelect.innerHTML = `
      <option value="ok">OK</option>
      <option value="plus2">+2</option>
      <option value="dnf">DNF</option>
    `;
    penaltySelect.value = solve.penalty;

    header.append(label, time, penaltySelect);

    const meta = document.createElement("div");
    meta.className = "solve-meta";
    const scrambleText = solve.scramble || "No scramble";
    meta.textContent = scrambleText;

    item.append(header, meta);
    list.append(item);
  });
};

export const bindHistory = () => {
  const list = solveList();
  if (list) {
    list.addEventListener("change", (event) => {
      const target = event.target;
      if (!target.classList.contains("solve-penalty")) {
        return;
      }

      const item = target.closest(".solve-item");
      if (!item) {
        return;
      }

      updateSolvePenalty(item.dataset.solveId, target.value);
      renderSolves();
      renderStats();
      renderCharts();
    });
  }

  const clear = clearButton();
  if (clear) {
    clear.addEventListener("click", () => {
      const { cubeType, sessionId } = getState().settings;
      clearSolvesForSelection(cubeType ?? "3x3", sessionId);
      renderSolves();
      renderStats();
      renderCharts();
    });
  }
};

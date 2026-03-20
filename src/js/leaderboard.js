import { getState, getActiveSolves } from "./storage.js";
import { formatTime, applyPenalty, validateScramble } from "./utils.js";
import { CUBE_TYPES, getCubeConfig } from "./cubes.js";

const leaderboardSelect = () => document.getElementById("leaderboard-cube");
const leaderboardList = () => document.getElementById("leaderboard-list");
const leaderboardEmpty = () => document.getElementById("leaderboard-empty");
const submitButton = () => document.getElementById("leaderboard-submit");

let leaderboardData = null;

const loadLeaderboard = async () => {
  try {
    const response = await fetch("./data/leaderboard.json", { cache: "no-cache" });
    leaderboardData = await response.json();
  } catch (error) {
    console.warn("Failed to load leaderboard.", error);
    leaderboardData = { records: {} };
  }
};

const renderLeaderboard = (cubeType) => {
  const list = leaderboardList();
  const empty = leaderboardEmpty();
  if (!list) {
    return;
  }

  list.innerHTML = "";
  const records = leaderboardData?.records?.[cubeType] ?? [];
  const sorted = [...records].sort((a, b) => (a.timeMs ?? 0) - (b.timeMs ?? 0));

  if (!sorted.length) {
    if (empty) {
      empty.classList.remove("hide");
    }
    return;
  }

  if (empty) {
    empty.classList.add("hide");
  }

  sorted.slice(0, 10).forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = "leaderboard-item";

    const left = document.createElement("div");
    left.innerHTML = `<div class="leaderboard-name">#${index + 1} ${entry.name}</div>`;

    const right = document.createElement("div");
    right.className = "leaderboard-meta";
    const verified = entry.verified ? "✓" : "";
    right.innerHTML = `${formatTime(entry.timeMs ?? 0, 3)} ${verified}<br>${entry.date ?? ""}`;

    item.append(left, right);
    list.append(item);
  });
};

const buildSubmissionUrl = () => {
  const { settings } = getState();
  const cubeType = settings.cubeType ?? "3x3";
  const filtered = getActiveSolves();
  const validSolves = filtered
    .filter((solve) => solve.penalty !== "dnf")
    .map((solve) => {
      const adjusted = applyPenalty(solve);
      return { ...solve, adjusted };
    })
    .sort((a, b) => a.adjusted - b.adjusted);

  const best = validSolves[0];
  const scramble = best?.scramble ?? "";
  const { moves, scrambleLength } = getCubeConfig(cubeType);
  const verified = validateScramble(scramble, moves, scrambleLength) ? "Yes" : "No";
  const timeDisplay = best ? formatTime(best.adjusted, settings.precision) : "";

  const title = `Leaderboard Submission - ${cubeType} - ${timeDisplay}`;
  const body = [
    `Name:`,
    `Time: ${timeDisplay}`,
    `Cube: ${cubeType}`,
    `Scramble: ${scramble}`,
    `Verified scramble: ${verified}`,
    `Session: ${activeSession}`,
    `Notes:`,
  ].join("\n");

  const params = new URLSearchParams({ title, body });
  return `https://github.com/jayhemnani9910/rubiks-cube/issues/new?${params.toString()}`;
};

export const initLeaderboard = async () => {
  await loadLeaderboard();

  const select = leaderboardSelect();
  if (select) {
    select.innerHTML = CUBE_TYPES.map(
      (type) => `<option value="${type.id}">${type.label}</option>`
    ).join("");
    select.value = getState().settings.cubeType ?? "3x3";
    select.addEventListener("change", (event) => {
      renderLeaderboard(event.target.value);
    });
  }

  renderLeaderboard(select?.value ?? "3x3");

  const submit = submitButton();
  if (submit) {
    submit.addEventListener("click", () => {
      const url = buildSubmissionUrl();
      window.open(url, "_blank");
    });
  }
};

export const refreshLeaderboard = () => {
  const select = leaderboardSelect();
  const activeCube = getState().settings.cubeType ?? "3x3";
  if (select) {
    select.value = activeCube;
  }
  renderLeaderboard(select?.value ?? activeCube);
};

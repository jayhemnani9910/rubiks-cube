import { getState } from "./storage.js";
import { formatTime } from "./utils.js";
import { CUBE_TYPES, getCubeConfig } from "./cubes.js";

const leaderboardSelect = () => document.getElementById("leaderboard-cube");
const leaderboardList = () => document.getElementById("leaderboard-list");
const leaderboardEmpty = () => document.getElementById("leaderboard-empty");
const submitButton = () => document.getElementById("leaderboard-submit");

let leaderboardData = null;

const loadLeaderboard = async () => {
  try {
    const response = await fetch("./data/leaderboard.json", { cache: "no-store" });
    leaderboardData = await response.json();
  } catch (error) {
    console.warn("Failed to load leaderboard.", error);
    leaderboardData = { records: {} };
  }
};

const parseTokens = (scramble) =>
  scramble
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const normalizeToken = (token) => {
  const modifier = token.endsWith("'")
    ? "'"
    : token.endsWith("2")
    ? "2"
    : "";
  const base = modifier ? token.slice(0, -1) : token;
  return { base, modifier };
};

const isScrambleValid = (scramble, cubeType) => {
  if (!scramble) {
    return false;
  }

  const { moves, scrambleLength } = getCubeConfig(cubeType);
  const tokens = parseTokens(scramble);
  if (tokens.length < scrambleLength) {
    return false;
  }

  const moveSet = new Set(moves);
  return tokens.every((token) => {
    const { base, modifier } = normalizeToken(token);
    if (!moveSet.has(base)) {
      return false;
    }
    return modifier === "" || modifier === "2" || modifier === "'";
  });
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
  const { solves, settings } = getState();
  const cubeType = settings.cubeType ?? "3x3";
  const activeSession = settings.sessionId;
  const filtered = solves.filter(
    (solve) =>
      (solve.cubeType ?? "3x3") === cubeType && solve.sessionId === activeSession
  );
  const validSolves = filtered
    .filter((solve) => solve.penalty !== "dnf")
    .map((solve) => {
      const adjusted = solve.penalty === "plus2" ? solve.timeMs + 2000 : solve.timeMs;
      return { ...solve, adjusted };
    })
    .sort((a, b) => a.adjusted - b.adjusted);

  const best = validSolves[0];
  const scramble = best?.scramble ?? "";
  const verified = isScrambleValid(scramble, cubeType) ? "Yes" : "No";
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

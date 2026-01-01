import { getState } from "./storage.js";
import { formatTime } from "./utils.js";

const statValue = (id) => document.getElementById(id);
const pbList = () => document.getElementById("pb-list");
const pbEmpty = () => document.getElementById("pb-empty");

const applyPenalty = (solve) => {
  if (solve.penalty === "dnf") {
    return null;
  }

  const base = solve.timeMs ?? 0;
  return solve.penalty === "plus2" ? base + 2000 : base;
};

const computeAverage = (values) => {
  if (!values.length) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const computeAverageOf = (solves, count) => {
  if (solves.length < count) {
    return null;
  }

  const recent = solves.slice(0, count);
  const numeric = recent.map((solve) => applyPenalty(solve));
  const dnfCount = numeric.filter((value) => value === null).length;

  if (dnfCount >= 2) {
    return "DNF";
  }

  const sortable = numeric.map((value) => (value === null ? Infinity : value));
  sortable.sort((a, b) => a - b);
  const trimmed = sortable.slice(1, -1);
  if (!trimmed.length || trimmed.some((value) => !Number.isFinite(value))) {
    return "DNF";
  }

  return computeAverage(trimmed);
};

const formatStat = (value, precision) => {
  if (value === "DNF") {
    return "DNF";
  }

  if (value === null || value === undefined) {
    return "--";
  }

  return formatTime(value, precision);
};

const formatDate = (isoString) => {
  if (!isoString) {
    return "";
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
};

const renderPbHistory = (solves, precision) => {
  const list = pbList();
  const empty = pbEmpty();

  if (!list) {
    return;
  }

  list.innerHTML = "";

  let best = Infinity;
  const history = [];
  const chronological = solves.slice().reverse();

  chronological.forEach((solve) => {
    const value = applyPenalty(solve);
    if (value === null) {
      return;
    }
    if (value < best) {
      best = value;
      history.push({
        time: value,
        createdAt: solve.createdAt,
      });
    }
  });

  if (!history.length) {
    if (empty) {
      empty.classList.remove("hide");
    }
    return;
  }

  if (empty) {
    empty.classList.add("hide");
  }

  history
    .slice(-10)
    .reverse()
    .forEach((entry) => {
      const item = document.createElement("li");
      item.className = "pb-item";

      const time = document.createElement("span");
      time.className = "pb-time";
      time.textContent = formatTime(entry.time, precision);

      const meta = document.createElement("span");
      meta.className = "pb-meta";
      meta.textContent = formatDate(entry.createdAt);

      item.append(time, meta);
      list.append(item);
    });
};

export const renderStats = () => {
  const { solves, settings } = getState();
  const activeCube = settings.cubeType ?? "3x3";
  const activeSession = settings.sessionId;
  const filteredSolves = solves.filter(
    (solve) =>
      (solve.cubeType ?? "3x3") === activeCube &&
      solve.sessionId === activeSession
  );

  const times = filteredSolves
    .map((solve) => applyPenalty(solve))
    .filter((value) => value !== null);

  const best = times.length ? Math.min(...times) : null;
  const worst = times.length ? Math.max(...times) : null;
  const mean = computeAverage(times);
  const ao5 = computeAverageOf(filteredSolves, 5);
  const ao12 = computeAverageOf(filteredSolves, 12);
  const ao100 = computeAverageOf(filteredSolves, 100);

  const precision = settings.precision;
  const values = {
    "stat-best": formatStat(best, precision),
    "stat-worst": formatStat(worst, precision),
    "stat-mean": formatStat(mean, precision),
    "stat-ao5": formatStat(ao5, precision),
    "stat-ao12": formatStat(ao12, precision),
    "stat-ao100": formatStat(ao100, precision),
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = statValue(id);
    if (element) {
      element.textContent = value;
    }
  });

  renderPbHistory(filteredSolves, precision);
};

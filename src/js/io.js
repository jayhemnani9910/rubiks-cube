import { getState, updateState } from "./storage.js";
import { formatTime } from "./utils.js";

const exportJsonButton = () => document.getElementById("export-json");
const exportCsvButton = () => document.getElementById("export-csv");
const importButton = () => document.getElementById("import-json");
const importFile = () => document.getElementById("import-file");

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const exportJson = () => {
  const data = JSON.stringify(getState(), null, 2);
  downloadFile(data, "rubiks-cube-data.json", "application/json");
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
};

const formatSolveTime = (solve, precision) => {
  if (solve.penalty === "dnf") {
    return "DNF";
  }
  const base = solve.timeMs ?? 0;
  const adjusted = solve.penalty === "plus2" ? base + 2000 : base;
  return formatTime(adjusted, precision);
};

const exportCsv = () => {
  const { solves, settings, sessions } = getState();
  const activeCube = settings.cubeType ?? "3x3";
  const activeSession = settings.sessionId;
  const activeSessionName =
    sessions.find((session) => session.id === activeSession)?.name ??
    "Session";
  const precision = settings.precision;

  const filtered = solves.filter(
    (solve) =>
      (solve.cubeType ?? "3x3") === activeCube &&
      solve.sessionId === activeSession
  );

  const header = [
    "session",
    "cube",
    "time_ms",
    "time_display",
    "penalty",
    "scramble",
    "created_at",
  ];

  const rows = filtered.map((solve) => [
    activeSessionName,
    solve.cubeType ?? "3x3",
    solve.timeMs ?? "",
    formatSolveTime(solve, precision),
    solve.penalty ?? "ok",
    solve.scramble ?? "",
    solve.createdAt ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  downloadFile(csv, "rubiks-cube-solves.csv", "text/csv");
};

const importJson = (file) => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      updateState(() => parsed);
      window.location.reload();
    } catch (error) {
      console.error("Import failed.", error);
      window.alert("Import failed. Please select a valid JSON export.");
    }
  };
  reader.readAsText(file);
};

export const initIO = () => {
  const jsonButton = exportJsonButton();
  if (jsonButton) {
    jsonButton.addEventListener("click", exportJson);
  }

  const csvButton = exportCsvButton();
  if (csvButton) {
    csvButton.addEventListener("click", exportCsv);
  }

  const importTrigger = importButton();
  const fileInput = importFile();

  if (importTrigger && fileInput) {
    importTrigger.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      const confirmed = window.confirm(
        "Importing will overwrite your current local data. Continue?"
      );
      if (!confirmed) {
        fileInput.value = "";
        return;
      }
      importJson(file);
    });
  }
};

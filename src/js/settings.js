import { getState, updateSettings } from "./storage.js";
import { refreshTimer, setInspectionEnabled } from "./timer.js";
import { renderSolves } from "./history.js";
import { renderStats } from "./stats.js";
import { renderCharts } from "./charts.js";
import { resetCube } from "./cube.js";
import { generateScramble } from "./scramble.js";
import { CUBE_TYPES } from "./cubes.js";

const THEME_FIELDS = [
  { id: "custom-bg-start", variable: "--color-bg-start" },
  { id: "custom-bg-end", variable: "--color-bg-end" },
  { id: "custom-text", variable: "--color-text" },
  { id: "custom-border", variable: "--color-border" },
  { id: "custom-muted", variable: "--color-muted" },
  { id: "custom-front", variable: "--face-front" },
  { id: "custom-back", variable: "--face-back" },
  { id: "custom-up", variable: "--face-up" },
  { id: "custom-down", variable: "--face-down" },
  { id: "custom-right", variable: "--face-right" },
  { id: "custom-left", variable: "--face-left" },
];

const themeSelect = () => document.getElementById("theme-select");
const customPanel = () => document.getElementById("custom-theme-panel");
const inspectionToggle = () => document.getElementById("inspection-toggle");
const precisionSelect = () => document.getElementById("precision-select");
const cubeSelect = () => document.getElementById("cube-select");
const cubeNote = () => document.getElementById("cube-note");
const cubeLabel = () => document.getElementById("cube-label");

const applyCustomTheme = (customTheme) => {
  Object.entries(customTheme).forEach(([variable, value]) => {
    document.documentElement.style.setProperty(variable, value);
  });
};

const clearCustomTheme = () => {
  THEME_FIELDS.forEach((field) => {
    document.documentElement.style.removeProperty(field.variable);
  });
};

const applyTheme = (theme, customTheme) => {
  document.documentElement.dataset.theme = theme;
  if (theme === "custom") {
    applyCustomTheme(customTheme);
  } else {
    clearCustomTheme();
  }

  resetCube();
};

const updateCubeNote = (cubeType) => {
  const note = cubeNote();
  if (!note) {
    return;
  }

  note.classList.toggle("hide", cubeType === "3x3");
};

const updateCubeLabel = (cubeType) => {
  const label = cubeLabel();
  if (!label) {
    return;
  }

  label.textContent = cubeType;
};

export const initSettings = () => {
  const { settings } = getState();

  const inspection = inspectionToggle();
  if (inspection) {
    inspection.checked = settings.inspectionEnabled;
    inspection.addEventListener("change", (event) => {
      setInspectionEnabled(event.target.checked);
    });
  }

  const precision = precisionSelect();
  if (precision) {
    precision.value = String(settings.precision);
    precision.addEventListener("change", (event) => {
      const value = Number(event.target.value);
      updateSettings({ precision: value });
      refreshTimer();
      renderSolves();
      renderStats();
      renderCharts();
    });
  }

  const theme = themeSelect();
  if (theme) {
    theme.value = settings.theme;
    theme.addEventListener("change", (event) => {
      const value = event.target.value;
      updateSettings({ theme: value });
      applyTheme(value, getState().settings.customTheme);
      renderCharts();
      const panel = customPanel();
      if (panel) {
        panel.classList.toggle("hide", value !== "custom");
      }
    });
  }

  const cube = cubeSelect();
  if (cube) {
    cube.innerHTML = CUBE_TYPES.map(
      (type) => `<option value="${type.id}">${type.label}</option>`
    ).join("");
    cube.value = settings.cubeType ?? "3x3";
    cube.addEventListener("change", (event) => {
      const value = event.target.value;
      updateSettings({ cubeType: value });
      resetCube();
      generateScramble();
      renderSolves();
      renderStats();
      renderCharts();
      updateCubeNote(value);
      updateCubeLabel(value);
    });
  }

  THEME_FIELDS.forEach((field) => {
    const input = document.getElementById(field.id);
    if (!input) {
      return;
    }

    input.value = settings.customTheme[field.variable] ?? "";
    input.addEventListener("input", (event) => {
      const value = event.target.value;
      const updated = {
        ...getState().settings.customTheme,
        [field.variable]: value,
      };
      updateSettings({ customTheme: updated });
      applyTheme("custom", updated);
      renderCharts();
    });
  });

  applyTheme(settings.theme, settings.customTheme);
  const panel = customPanel();
  if (panel) {
    panel.classList.toggle("hide", settings.theme !== "custom");
  }
  updateCubeNote(settings.cubeType ?? "3x3");
  updateCubeLabel(settings.cubeType ?? "3x3");
};

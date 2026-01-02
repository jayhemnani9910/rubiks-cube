import { getState, updateSettings } from "./storage.js";
import { refreshTimer, setInspectionEnabled } from "./timer.js";
import { renderSolves } from "./history.js";
import { renderStats } from "./stats.js";
import { renderCharts } from "./charts.js";
import { refreshLeaderboard } from "./leaderboard.js";
import { resetCube, rebuildThreeCube } from "./cube.js";
import { generateScramble } from "./scramble.js";
import { CUBE_TYPES, getCubeConfig } from "./cubes.js";
import { rebuildPreview } from "./preview.js";

/**
 * Validates if a string is a valid CSS color
 */
const isValidColor = (color) => {
  if (!color || typeof color !== "string") {
    return false;
  }
  // Check common color formats
  const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
  const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*(0|1|0?\.\d+))?\s*\)$/;
  const hslRegex = /^hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?(\s*,\s*(0|1|0?\.\d+))?\s*\)$/;
  const namedColors = /^(transparent|currentColor|inherit|initial|unset|[a-z]+)$/i;
  return hexRegex.test(color) || rgbRegex.test(color) || hslRegex.test(color) || namedColors.test(color);
};

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
const soundToggle = () => document.getElementById("sound-toggle");
const precisionSelect = () => document.getElementById("precision-select");
const cubeSelect = () => document.getElementById("cube-select");
const cubeNote = () => document.getElementById("cube-note");
const cubeLabel = () => document.getElementById("cube-label");
const cubeScramble = () => document.getElementById("cube-scramble");
const cubeInspection = () => document.getElementById("cube-inspection");

const applyCustomTheme = (customTheme) => {
  Object.entries(customTheme).forEach(([variable, value]) => {
    // Only apply valid colors to prevent CSS injection
    if (isValidColor(value)) {
      document.documentElement.style.setProperty(variable, value);
    }
  });
};

const clearCustomTheme = () => {
  THEME_FIELDS.forEach((field) => {
    document.documentElement.style.removeProperty(field.variable);
  });
};

const applyTheme = (theme, customTheme) => {
  // Preserve current scramble before theme change
  const scrambleEl = document.getElementById("seq");
  const currentScramble = scrambleEl?.textContent;

  // Migrate legacy "custom" theme to "dark"
  const effectiveTheme = theme === "custom" ? "dark" : theme;
  document.documentElement.dataset.theme = effectiveTheme;
  clearCustomTheme();

  resetCube();

  // Restore scramble after theme change
  if (scrambleEl && currentScramble && currentScramble !== "\u00A0") {
    scrambleEl.textContent = currentScramble;
  }
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

const updateCubeMeta = (cubeType) => {
  const config = getCubeConfig(cubeType);
  const scramble = cubeScramble();
  const inspection = cubeInspection();

  if (scramble) {
    scramble.textContent = `Scramble: ${config.scrambleLength} moves`;
  }
  if (inspection) {
    inspection.textContent = `Inspection: ${config.inspectionSeconds ?? 15}s`;
  }
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

  const sound = soundToggle();
  if (sound) {
    sound.checked = settings.soundEnabled;
    sound.addEventListener("change", (event) => {
      updateSettings({ soundEnabled: event.target.checked });
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
    // Migrate legacy "custom" theme to "dark"
    const effectiveTheme = settings.theme === "custom" ? "dark" : settings.theme;
    theme.value = effectiveTheme;
    theme.addEventListener("change", (event) => {
      const value = event.target.value;
      updateSettings({ theme: value });
      applyTheme(value, {});
      renderCharts();
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
      rebuildPreview(); // Rebuild preview for new cube size
      rebuildThreeCube(); // Rebuild 3D cube for new size
      resetCube();
      generateScramble();
      renderSolves();
      renderStats();
      renderCharts();
      refreshLeaderboard();
      updateCubeNote(value);
      updateCubeLabel(value);
      updateCubeMeta(value);
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

  applyTheme(settings.theme, {});
  updateCubeNote(settings.cubeType ?? "3x3");
  updateCubeLabel(settings.cubeType ?? "3x3");
  updateCubeMeta(settings.cubeType ?? "3x3");
};

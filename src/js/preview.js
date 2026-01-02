import { getState } from "./storage.js";
import {
  getCubeSize,
  generatePreviewDOM,
  syncPreviewFromState,
  initCubeColors,
} from "./dynamic-cube.js";

const previewCells = () => document.querySelectorAll(".preview-face span");
const previewNote = () => document.getElementById("preview-note");

const getPieceColor = (pieceId) => {
  const element = document.getElementById(pieceId);
  if (!element) {
    return null;
  }
  return window.getComputedStyle(element).getPropertyValue("background-color");
};

/**
 * Rebuild the preview panel for the current cube size
 */
export const rebuildPreview = () => {
  const size = getCubeSize();
  const previewNet = document.getElementById("preview-net");

  if (previewNet) {
    generatePreviewDOM(previewNet, size);
    // Initialize cube state and sync preview
    initCubeColors(size);
    syncPreviewFromState();
  }

  // Update preview note visibility (show for all sizes now since we support them)
  const note = previewNote();
  if (note) {
    note.classList.add("hide");
  }
};

export const syncPreview = () => {
  const cells = previewCells();
  if (!cells.length) {
    return;
  }

  // For backwards compatibility, try to sync from DOM first (for 3x3)
  const cubeSize = getCubeSize();
  if (cubeSize === 3) {
    cells.forEach((cell) => {
      const pieceId = cell.dataset.piece;
      if (!pieceId) {
        return;
      }
      const color = getPieceColor(pieceId);
      if (color) {
        cell.style.backgroundColor = color;
      }
    });
  } else {
    // For other sizes, sync from the logical state
    syncPreviewFromState();
  }

  const cubeType = getState().settings.cubeType ?? "3x3";
  const note = previewNote();
  if (note) {
    // Hide note since we now support all sizes
    note.classList.add("hide");
  }
};

export const initPreview = () => {
  rebuildPreview();
};

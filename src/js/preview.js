import {
  getCubeSize,
  generatePreviewDOM,
  syncPreviewFromState,
  initCubeColors,
} from "./dynamic-cube.js";

const previewNote = () => document.getElementById("preview-note");

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
  syncPreviewFromState();
};

export const initPreview = () => {
  rebuildPreview();
};

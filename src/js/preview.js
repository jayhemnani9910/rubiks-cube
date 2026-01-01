import { getState } from "./storage.js";

const previewCells = () => document.querySelectorAll(".preview-face span");
const previewNote = () => document.getElementById("preview-note");

const getPieceColor = (pieceId) => {
  const element = document.getElementById(pieceId);
  if (!element) {
    return null;
  }
  return window.getComputedStyle(element).getPropertyValue("background-color");
};

export const syncPreview = () => {
  const cells = previewCells();
  if (!cells.length) {
    return;
  }

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

  const cubeType = getState().settings.cubeType ?? "3x3";
  const note = previewNote();
  if (note) {
    note.classList.toggle("hide", cubeType === "3x3" || cubeType === "2x2");
  }
};

export const initPreview = () => {
  syncPreview();
};

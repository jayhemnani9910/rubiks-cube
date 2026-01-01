import {
  getState,
  getSessions,
  addSession,
  renameSession,
  deleteSession,
  setActiveSession,
} from "./storage.js";
import { renderSolves } from "./history.js";
import { renderStats } from "./stats.js";
import { renderCharts } from "./charts.js";

const sessionSelect = () => document.getElementById("session-select");
const newButton = () => document.getElementById("session-new");
const renameButton = () => document.getElementById("session-rename");
const deleteButton = () => document.getElementById("session-delete");

const refreshSessionOptions = () => {
  const select = sessionSelect();
  if (!select) {
    return;
  }

  const sessions = getSessions();
  select.innerHTML = sessions
    .map((session) => `<option value="${session.id}">${session.name}</option>`)
    .join("");

  select.value = getState().settings.sessionId ?? sessions[0]?.id ?? "";
};

const renderAll = () => {
  renderSolves();
  renderStats();
  renderCharts();
};

export const initSessions = () => {
  refreshSessionOptions();

  const select = sessionSelect();
  if (select) {
    select.addEventListener("change", (event) => {
      setActiveSession(event.target.value);
      renderAll();
    });
  }

  const create = newButton();
  if (create) {
    create.addEventListener("click", () => {
      const name = window.prompt("Session name", "New Session");
      if (name === null) {
        return;
      }
      addSession(name);
      refreshSessionOptions();
      renderAll();
    });
  }

  const rename = renameButton();
  if (rename) {
    rename.addEventListener("click", () => {
      const { sessionId } = getState().settings;
      if (!sessionId) {
        return;
      }
      const current = getSessions().find((session) => session.id === sessionId);
      const name = window.prompt("Rename session", current?.name ?? "Session");
      if (name === null) {
        return;
      }
      renameSession(sessionId, name);
      refreshSessionOptions();
      renderAll();
    });
  }

  const remove = deleteButton();
  if (remove) {
    remove.addEventListener("click", () => {
      const { sessionId } = getState().settings;
      if (!sessionId) {
        return;
      }
      const current = getSessions().find((session) => session.id === sessionId);
      const confirmed = window.confirm(
        `Delete session "${current?.name ?? "Session"}"? This removes its solves.`
      );
      if (!confirmed) {
        return;
      }
      deleteSession(sessionId);
      refreshSessionOptions();
      renderAll();
    });
  }
};

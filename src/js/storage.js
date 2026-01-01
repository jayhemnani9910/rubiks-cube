import { createId } from "./utils.js";

const STORAGE_KEY = "rubiksCubeState";

const DEFAULT_STATE = {
  settings: {
    cubeType: "3x3",
    sessionId: null,
    theme: "dark",
    inspectionEnabled: true,
    precision: 3,
    customTheme: {
      "--color-bg-start": "#505050",
      "--color-bg-end": "#000000",
      "--color-text": "#ffffff",
      "--color-border": "#ffffff",
      "--color-muted": "#a0a0a0",
      "--face-front": "#008000",
      "--face-back": "#0000ff",
      "--face-up": "#ffffff",
      "--face-down": "#ffff00",
      "--face-right": "#ff0000",
      "--face-left": "#ff8c00",
    },
  },
  sessions: [],
  solves: [],
};

const createDefaultSession = (id) => ({
  id,
  name: "Session 1",
  createdAt: new Date().toISOString(),
});

const mergeState = (state) => {
  const settings = {
    ...DEFAULT_STATE.settings,
    ...(state?.settings ?? {}),
    customTheme: {
      ...DEFAULT_STATE.settings.customTheme,
      ...(state?.settings?.customTheme ?? {}),
    },
  };

  const incomingSessions = Array.isArray(state?.sessions) ? state.sessions : [];
  const fallbackSessionId =
    settings.sessionId ?? incomingSessions[0]?.id ?? createId();
  const sessions = incomingSessions.length
    ? incomingSessions
    : [createDefaultSession(fallbackSessionId)];
  const sessionIds = new Set(sessions.map((session) => session.id));
  const activeSessionId = sessionIds.has(settings.sessionId)
    ? settings.sessionId
    : sessions[0].id;

  const solves = Array.isArray(state?.solves) ? state.solves : [];
  const normalizedSolves = solves.map((solve) => ({
    ...solve,
    sessionId: solve.sessionId ?? activeSessionId,
  }));

  return {
    ...DEFAULT_STATE,
    ...state,
    settings: {
      ...settings,
      sessionId: activeSessionId,
    },
    sessions,
    solves: normalizedSolves,
  };
};

const loadState = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return mergeState({});
  }

  try {
    const parsed = JSON.parse(stored);
    return mergeState(parsed);
  } catch (error) {
    console.warn("Failed to parse saved state, resetting.", error);
    return mergeState({});
  }
};

let cachedState = loadState();

export const getState = () => cachedState;

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
};

export const updateState = (updater) => {
  cachedState = mergeState(updater(mergeState(cachedState)));
  saveState();
  return cachedState;
};

export const updateSettings = (partialSettings) =>
  updateState((state) => ({
    ...state,
    settings: {
      ...state.settings,
      ...partialSettings,
      customTheme: {
        ...state.settings.customTheme,
        ...(partialSettings.customTheme ?? {}),
      },
    },
  }));

export const setActiveSession = (sessionId) =>
  updateSettings({ sessionId });

export const getSessions = () => getState().sessions;

export const addSession = (name) =>
  updateState((state) => {
    const id = createId();
    const label = name?.trim() || `Session ${state.sessions.length + 1}`;
    const session = {
      id,
      name: label,
      createdAt: new Date().toISOString(),
    };
    return {
      ...state,
      sessions: [...state.sessions, session],
      settings: {
        ...state.settings,
        sessionId: id,
      },
    };
  });

export const renameSession = (sessionId, name) =>
  updateState((state) => ({
    ...state,
    sessions: state.sessions.map((session) =>
      session.id === sessionId
        ? { ...session, name: name?.trim() || session.name }
        : session
    ),
  }));

export const deleteSession = (sessionId) =>
  updateState((state) => {
    let sessions = state.sessions.filter((session) => session.id !== sessionId);
    let activeSessionId = state.settings.sessionId;

    if (!sessions.length) {
      const newId = createId();
      sessions = [createDefaultSession(newId)];
      activeSessionId = newId;
    } else if (!sessions.find((session) => session.id === activeSessionId)) {
      activeSessionId = sessions[0].id;
    }

    return {
      ...state,
      sessions,
      solves: state.solves.filter((solve) => solve.sessionId !== sessionId),
      settings: {
        ...state.settings,
        sessionId: activeSessionId,
      },
    };
  });

export const addSolve = (solve) =>
  updateState((state) => ({
    ...state,
    solves: [solve, ...state.solves].slice(0, 200),
  }));

export const updateSolvePenalty = (id, penalty) =>
  updateState((state) => ({
    ...state,
    solves: state.solves.map((solve) =>
      solve.id === id ? { ...solve, penalty } : solve
    ),
  }));

export const clearSolvesForSelection = (cubeType, sessionId) =>
  updateState((state) => ({
    ...state,
    solves: state.solves.filter(
      (solve) =>
        (solve.cubeType ?? "3x3") !== cubeType ||
        solve.sessionId !== sessionId
    ),
  }));

import { loadSolverModule } from "../wasm/solver-loader.js";
import { getCubeConfig } from "./cubes.js";
import { getState } from "./storage.js";

const output = () => document.getElementById("solver-output");
const validateButton = () => document.getElementById("solver-validate");
const hintButton = () => document.getElementById("solver-hint");

let solverModule = null;

const getScramble = () => {
  const text = document.getElementById("seq")?.textContent?.trim();
  return text && text !== "\u00A0" ? text : "";
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

const jsValidateScramble = (scramble, cubeType) => {
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

const renderOutput = (message) => {
  if (output()) {
    output().textContent = message;
  }
};

const validateScramble = () => {
  const scramble = getScramble();
  if (!scramble) {
    renderOutput("Generate a scramble first.");
    return;
  }
  const cubeType = getState().settings.cubeType ?? "3x3";

  if (solverModule?.cwrap) {
    const validate = solverModule.cwrap("validate_scramble", "number", ["string"]);
    const valid = validate(scramble) === 1;
    renderOutput(valid ? "Scramble validated (WASM)." : "Scramble invalid.");
    return;
  }

  const valid = jsValidateScramble(scramble, cubeType);
  renderOutput(valid ? "Scramble looks valid (JS check)." : "Scramble invalid.");
};

const getHint = () => {
  const scramble = getScramble();
  if (!scramble) {
    renderOutput("Generate a scramble first.");
    return;
  }

  if (solverModule?.cwrap) {
    const getHintWasm = solverModule.cwrap("get_hint", "number", ["string", "number", "number"]);
    const buffer = solverModule._malloc(128);
    getHintWasm(scramble, buffer, 128);
    const hint = solverModule.UTF8ToString(buffer);
    solverModule._free(buffer);
    renderOutput(hint || "Try pairing a corner and edge.");
    return;
  }

  renderOutput("Try finding a pair and insert it with R U R'.");
};

export const initSolver = async () => {
  solverModule = await loadSolverModule();

  validateButton()?.addEventListener("click", validateScramble);
  hintButton()?.addEventListener("click", getHint);
};

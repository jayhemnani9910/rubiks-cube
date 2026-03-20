import { loadSolverModule } from "../wasm/solver-loader.js";
import { getCubeConfig } from "./cubes.js";
import { getState } from "./storage.js";
import { EMPTY_SCRAMBLE, validateScramble as checkScrambleValid } from "./utils.js";

const output = () => document.getElementById("solver-output");
const validateButton = () => document.getElementById("solver-validate");
const hintButton = () => document.getElementById("solver-hint");

let solverModule = null;

const getScramble = () => {
  const text = document.getElementById("seq")?.textContent?.trim();
  return text && text !== EMPTY_SCRAMBLE ? text : "";
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

  const { moves, scrambleLength } = getCubeConfig(cubeType);
  const valid = checkScrambleValid(scramble, moves, scrambleLength);
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

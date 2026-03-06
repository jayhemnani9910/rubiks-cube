let wasmModule = null;

export const loadSolverModule = async () => {
  if (wasmModule !== null) {
    return wasmModule;
  }

  try {
    const modulePath = "./solver.js";
    const moduleFactory = (await import(/* @vite-ignore */ modulePath)).default;
    wasmModule = await moduleFactory();
    return wasmModule;
  } catch (error) {
    console.warn("WASM solver not available.", error);
    wasmModule = null;
    return null;
  }
};

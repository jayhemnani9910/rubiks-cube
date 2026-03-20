export const formatTime = (milliseconds, precision = 3) => {
  const safePrecision = Number.isFinite(precision) ? precision : 3;
  const totalSeconds = Math.max(0, milliseconds) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const secondsText = seconds.toFixed(safePrecision);
  const paddedSeconds = secondsText.padStart(
    safePrecision > 0 ? 3 + safePrecision : 2,
    "0"
  );

  if (minutes > 0) {
    return `${minutes}:${paddedSeconds}`;
  }

  return paddedSeconds;
};

export const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const EMPTY_SCRAMBLE = "\u00A0";

export const applyPenalty = (solve) => {
  if (solve.penalty === "dnf") {
    return null;
  }
  const base = solve.timeMs ?? 0;
  return solve.penalty === "plus2" ? base + 2000 : base;
};

export const parseTokens = (scramble) =>
  scramble
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export const normalizeToken = (token) => {
  const modifier = token.endsWith("'")
    ? "'"
    : token.endsWith("2")
    ? "2"
    : "";
  const base = modifier ? token.slice(0, -1) : token;
  return { base, modifier };
};

export const validateScramble = (scramble, moves, scrambleLength) => {
  if (!scramble) {
    return false;
  }

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

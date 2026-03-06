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

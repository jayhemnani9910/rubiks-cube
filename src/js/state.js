export const DIRECTIONS = ["right", "left", "up", "down", "front", "back"];

export const getFaceColors = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  return DIRECTIONS.map((direction) =>
    rootStyles.getPropertyValue(`--face-${direction}`).trim()
  );
};

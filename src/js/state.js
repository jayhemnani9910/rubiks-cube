export const DIRECTIONS = ["right", "left", "up", "down", "front", "back"];
export const FACE_ARRAY = ["3", "2", "1", "4", "7", "8", "9", "6"];

export const DIRECTION_INDEX = new Map();
for (let i = 0; i < DIRECTIONS.length; i += 1) {
  DIRECTION_INDEX.set(DIRECTIONS[i][0], i);
}

export const cubeState = {
  currentState: 1,
  currentClass: "s23",
  animationId: null,
};

export const getFaceColors = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  return DIRECTIONS.map((direction) =>
    rootStyles.getPropertyValue(`--face-${direction}`).trim()
  );
};

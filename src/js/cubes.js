const AXIS_MAP = {
  R: "x",
  L: "x",
  U: "y",
  D: "y",
  F: "z",
  B: "z",
};

const MODIFIERS = ["", "2", "'"];

export const CUBE_CONFIG = {
  "2x2": {
    label: "2x2",
    scrambleLength: 11,
    moves: ["R", "U", "F"],
  },
  "3x3": {
    label: "3x3",
    scrambleLength: 20,
    moves: ["R", "L", "U", "D", "F", "B"],
  },
  "4x4": {
    label: "4x4",
    scrambleLength: 40,
    moves: ["R", "L", "U", "D", "F", "B", "Rw", "Lw", "Uw", "Dw", "Fw", "Bw"],
  },
};

export const CUBE_TYPES = Object.keys(CUBE_CONFIG).map((id) => ({
  id,
  label: CUBE_CONFIG[id].label,
}));

export const getCubeConfig = (cubeType) =>
  CUBE_CONFIG[cubeType] ?? CUBE_CONFIG["3x3"];

const randomItem = (list) => list[Math.floor(Math.random() * list.length)];

const getAxis = (move) => AXIS_MAP[move[0]];

export const buildScramble = (cubeType) => {
  const { scrambleLength, moves } = getCubeConfig(cubeType);
  const sequence = [];
  let lastAxis = null;

  while (sequence.length < scrambleLength) {
    const move = randomItem(moves);
    const axis = getAxis(move);

    if (axis === lastAxis) {
      continue;
    }

    const modifier = randomItem(MODIFIERS);
    sequence.push(`${move}${modifier}`);
    lastAxis = axis;
  }

  return sequence;
};

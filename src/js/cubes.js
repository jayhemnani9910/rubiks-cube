const AXIS_MAP = {
  R: "x",
  L: "x",
  U: "y",
  D: "y",
  F: "z",
  B: "z",
};

const MODIFIERS = ["", "2", "'"];
const BASE_MOVES = ["R", "L", "U", "D", "F", "B"];
const WIDE_MOVES = ["Rw", "Lw", "Uw", "Dw", "Fw", "Bw"];
const TRIPLE_WIDE_MOVES = ["3Rw", "3Lw", "3Uw", "3Dw", "3Fw", "3Bw"];

export const CUBE_CONFIG = {
  "2x2": {
    label: "2x2",
    scrambleLength: 11,
    inspectionSeconds: 15,
    moves: ["R", "U", "F"],
  },
  "3x3": {
    label: "3x3",
    scrambleLength: 20,
    inspectionSeconds: 15,
    moves: BASE_MOVES,
  },
  "4x4": {
    label: "4x4",
    scrambleLength: 40,
    inspectionSeconds: 15,
    moves: [...BASE_MOVES, ...WIDE_MOVES],
  },
  "5x5": {
    label: "5x5",
    scrambleLength: 60,
    inspectionSeconds: 15,
    moves: [...BASE_MOVES, ...WIDE_MOVES],
  },
  "6x6": {
    label: "6x6",
    scrambleLength: 80,
    inspectionSeconds: 15,
    moves: [...BASE_MOVES, ...WIDE_MOVES, ...TRIPLE_WIDE_MOVES],
  },
  "7x7": {
    label: "7x7",
    scrambleLength: 100,
    inspectionSeconds: 15,
    moves: [...BASE_MOVES, ...WIDE_MOVES, ...TRIPLE_WIDE_MOVES],
  },
};

export const CUBE_TYPES = Object.keys(CUBE_CONFIG).map((id) => ({
  id,
  label: CUBE_CONFIG[id].label,
}));

export const getCubeConfig = (cubeType) =>
  CUBE_CONFIG[cubeType] ?? CUBE_CONFIG["3x3"];

const randomItem = (list) => list[Math.floor(Math.random() * list.length)];

const getFaceLetter = (move) => {
  const match = move.match(/[RLUDFB]/);
  return match ? match[0] : move[0];
};

const getAxis = (move) => AXIS_MAP[getFaceLetter(move)];

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

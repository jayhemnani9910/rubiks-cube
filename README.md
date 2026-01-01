[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-2ea44f?style=for-the-badge)](https://jayhemnani9910.github.io/rubiks-cube/)

# Rubik's Cube Visualizer + Timer
A keyboard-first Rubik's Cube visualizer with scramble generation, a configurable timer, and a flat (2D) view.

## Features
- 3D cube with face turns and cube rotations
- Scramble generator with cube selector (2x2 / 3x3 / 4x4)
- WCA-style inspection timer (+2/DNF) with precision settings
- Solve history + stats (best, worst, mean, Ao5, Ao12, Ao100) per cube and session
- Session management (create, rename, delete)
- PB progression timeline
- Trend and histogram charts powered by Chart.js
- JSON export/import and CSV export
- PWA-ready manifest + offline cache + install prompt
- Theme switcher (Dark/Light/Custom)
- Toggleable flat (2D) view
- Keyboard controls plus on-screen buttons for touch devices

## Preview
![main-cube](./assets/main.png)
![scrambled-cube](./assets/cube.png)
![flat-view](./assets/flat.png)

## Getting Started

### Option 1: Open the HTML directly
Open `index.html` in a browser to use the visualizer immediately.

### Option 2: Run the dev server (recommended)
```bash
npm install
npm run dev
```

## Controls
- Face moves: `l u r d f b`
- Prime (counter-clockwise): `Shift + l/u/r/d/f/b`
- Cube rotation: Arrow keys
- Scramble: `g`
- Reset cube: `z`
- Toggle view: `v`
- Start animation: `a`
- Stop animation: `Shift + a`
- Timer start/stop: `Space`
- Timer reset: `Escape`

## Project Structure
- `src/js/`: ES modules for cube state, input handling, timer, scrambles, settings, stats, charts, sessions, storage, IO, and PWA
- `src/css/`: main CSS entry point, theme variables, and component styles
- `assets/`: screenshots and images
- `scripts/`: helper generator (`cube.cpp`, `cubeinput.txt`)

## Notes
- Theme changes reset the cube to ensure colors update consistently.
- The visualizer currently renders a 3x3 cube even when other cube types are selected.
- On-screen cube controls are hidden on wide screens by default. To keep them visible, set `.buttons` to `visibility: visible;` in `src/css/main.css`.
- The Clear button removes solves for the currently selected cube and session.
- Charts require Chart.js, which is installed via `npm install`.
- Importing JSON overwrites your local browser data.
- Service worker registration happens only on `http(s)` origins, not `file://`.

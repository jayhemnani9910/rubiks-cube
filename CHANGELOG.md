# Changelog

All notable changes to this project are written down here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Demo GIF, changelog, and tests for scrambles and time formatting, which now run in CI.

### Changed

- Rewrote the README and contributing guide. Removed features the app no longer has.
- `.gitignore` now covers every `.env*` file except `.env.example`.

## [0.1.0] - 2026-10-06

Not tagged. The date is the last code change on `main`.

### Added

- 3D cube in Three.js with animated turns, sizes 2x2 to 7x7.
- Scrambles for each size, with 15-second inspection, +2 and DNF.
- Timer, sessions, solve history and stats (best, worst, mean, Ao5, Ao12, Ao100).
- Personal best list, and trend and histogram charts in Chart.js.
- JSON export and import.
- Tutorial and onboarding overlay.
- Service worker, manifest and install prompt.
- Dark and light themes.
- CI on pull requests, GitHub Pages deploy, Dependabot, ESLint and Prettier config.

### Changed

- Moved from one page of CSS cubes to a Vite project with ES modules.
- Redesigned the layout around slide-out panels (March 2026).
- Moved to ESLint 10 flat config and Vite 8.

### Fixed

- Turns in the 3D view ran the wrong way (R did R').
- Reset during a turn left ghost pieces.
- F and B moves scrambled the preview net.
- Held Space and Ctrl or Cmd shortcuts fired cube actions.
- Saved times came from the last animation frame.
- The cube was cut off when changing to larger sizes.

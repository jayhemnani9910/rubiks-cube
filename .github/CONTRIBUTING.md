# Contributing to rubiks-cube

Thanks for your interest! This project is a static PWA — visualizer, WCA-style timer, and stats — built with Vite, Three.js, and Chart.js.

## Development Setup

```bash
git clone https://github.com/jayhemnani9910/rubiks-cube.git
cd rubiks-cube
npm install
npm run dev
```

Open the URL printed by Vite. Edits hot-reload.

## Project Layout

- `src/js/` — ES modules (cube state, input, timer, scrambles, stats, storage, PWA, etc.)
- `src/css/` — theme variables and component styles
- `public/` — static assets shipped to the deployed site (manifest, service worker, icons)
- `docs/` — architecture diagrams (`.d2` sources + rendered SVGs)

See `docs/architecture.svg` for a high-level overview.

## Making Changes

1. Fork the repo and create a feature branch (`feat/short-description` or `fix/short-description`).
2. Keep commits focused. Match the existing commit-message style — a short imperative summary (e.g. `fix: cube cut-off on larger sizes`).
3. Before opening a PR:
   - `npm run build` must succeed.
   - `npm run lint` must pass without errors.
   - If you changed formatting-sensitive files, run `npm run format`.
4. Test the change in a browser. There is no automated test suite yet — describe what you verified in the PR.

## Style

- 2-space indent, single quotes, semicolons.
- ES module syntax (`import` / `export`).
- Prefer small, pure helpers in `src/js/utils.js` over duplicating logic.

## Reporting Issues

Use the issue templates for bugs and feature requests. For security issues, see `.github/SECURITY.md` — do not open a public issue.

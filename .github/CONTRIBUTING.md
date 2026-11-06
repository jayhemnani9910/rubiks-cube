# Contributing to rubiks-cube

I try to reply to issues within a few days.

## Setup

You need Node 20.19+ or 22.12+.

```bash
git clone https://github.com/jayhemnani9910/rubiks-cube.git
cd rubiks-cube
npm install
npm run dev
```

Open the URL Vite prints. Edits hot-reload. Opening `index.html` directly won't work, because browsers block ES modules on `file://`.

## Layout

- `src/js/`: ES modules for the cube, input, timer, scrambles, stats, storage and PWA
- `src/css/`: theme variables and styles
- `public/`: files shipped as they are (manifest, service worker, icons, data)
- `test/`: tests for the pure functions
- `docs/`: diagrams (D2 sources and SVGs) and the demo GIF

## Checks

CI runs these three on every pull request. Run them before you open one:

```bash
npm run lint
npm test
npm run build
```

The tests only cover scrambles and time formatting. For anything else, try it in a browser and say what you checked in the PR.

## Style

- Prettier settings are in `.prettierrc.json`. Not every file follows them yet, and `npm run format` rewrites all of them, so format only what you touched: `npx prettier --write <file>`.
- Use `import` and `export`.
- Put small pure helpers in `src/js/utils.js` instead of repeating them.

## Branches and PRs

1. Fork the repo and branch from `main` (`fix/short-description` or `feat/short-description`).
2. Keep commits small, with a short imperative message such as `fix: cube cut-off on larger sizes`.
3. Open the PR against `main` and fill in the template.

## Bug reports

Use the [issue forms](https://github.com/jayhemnani9910/rubiks-cube/issues/new/choose). Include your browser and OS, and the steps to reproduce. For security problems, follow `.github/SECURITY.md` and don't open a public issue.

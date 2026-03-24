# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A CSS debugging educational game built with React 19 + TypeScript + Vite. Players fix buggy CSS code across 8 levels to earn money, unlock tools in a shop, and progress through increasingly difficult challenges.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint on all files
npm run preview   # Preview production build
```

Testing uses Vitest with happy-dom environment and globals enabled:

```bash
npx vitest                    # Run all tests in watch mode
npx vitest run                # Run all tests once
npx vitest run src/store      # Run tests in a directory
npx vitest run path/to/file   # Run a single test file
```

## Architecture

### Routing (App.tsx)

```
/                       → MainMenu (new game / continue)
/board                  → ClientBoard (level selection grid)
/mission/:levelId       → Mission (main gameplay screen)
/shop                   → Shop (tool purchasing)
```

### State Management (Zustand)

Two stores with different lifecycles:

- **gameStore** — Persisted to localStorage (`debugger-game-save`). Holds money, completed levels, owned tools, in-progress CSS per level, best times. This is the save file.
- **levelStore** — Session-only. Holds current level data, edited CSS, test results, timer, and completion flag. Reset when switching levels.

### Gameplay Loop (Mission.tsx)

Mission is the central orchestrator: loads level data into levelStore, manages a timer via `useRef`/`setInterval`, debounce-saves CSS edits (300ms) to gameStore, runs tests against an iframe's computed styles, and triggers `LevelCompleteModal` when all assertions pass.

### Level Data (src/data/levels/)

Each level file exports a `Level` object with: HTML fixture, buggy CSS, solution CSS, line markers indicating which lines are editable, CSS property assertions (selector + property + expected value), payout amount, and prerequisite level IDs.

### Test Engine (src/engine/)

- **testRunner.ts** — Runs CSS assertions by querying computed styles from a DOM document. Tests check specific CSS properties on selected elements.
- **cssInjector.ts** — Builds complete HTML strings (with injected CSS) for iframe `srcdoc`.

### Key Patterns

- Monaco Editor for CSS editing, LivePreview renders via iframe `srcdoc` for isolation
- Tools purchased in Shop act as feature flags that conditionally enable gameplay aids
- Level prerequisites create a progression chain (levels unlock after dependencies are completed)
- All components are functional with hooks; handlers use `useCallback` for memoization

## Styling

Dark theme using CSS custom properties defined in `index.css`. Layout uses flexbox/grid. Class names follow BEM-inspired conventions (`.mission-screen`, `.level-card`, `.test-panel`).

## TypeScript

Strict mode enabled. Unused locals/parameters are errors. Target ES2023. Types live in `src/types/index.ts`.

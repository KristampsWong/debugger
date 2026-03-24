# Debugger Game — Design Spec

## Overview

A story-driven browser game where the player is a freelance developer who fixes CSS bugs in client websites. The player uses a real code editor (Monaco), sees live preview in an iframe, and watches test cases go from red to green. Earnings from completed contracts are spent on functional tool upgrades in a shop. Phase 1 focuses exclusively on CSS bugs.

**Target platform:** Browser-based, with future Steam release via Electron/Tauri.
**Tech stack:** React + TypeScript, Vite, Monaco Editor, Zustand, React Router.

## Core Game Structure

The game has 4 main screens:

### 1. Main Menu
- New game, continue, settings

### 2. Client Board
- A job board showing available contracts (levels)
- Each contract displays: client name, title, brief description, difficulty (1-5), payout
- Locked contracts require completing prerequisites or earning enough money

### 3. Mission Screen (Gameplay)
The main gameplay screen, split into panels:
- **Left panel:** Monaco code editor with the buggy CSS
- **Right panel (top):** Live preview iframe showing the rendered result
- **Right panel (bottom):** Test cases panel — list of tests with red/green status updating in real-time
- **Top bar:** Client brief (story context), optional timer, submit button

### 4. Level Complete Modal
When all tests pass and the player clicks submit (or automatically after a short delay):
- Displayed as a modal overlay on the Mission screen
- Shows: client thank-you message, payout amount, time taken
- Buttons: "Back to Board" (returns to Client Board), "Replay" (resets the level)
- On replay, no additional payout is awarded — UI shows "Already completed" instead of the payout amount

### 5. Shop
- Spend earnings on functional tool upgrades
- Accessible from the Client Board via a shop button

## Routing

| Route | Screen | Notes |
|-------|--------|-------|
| `/` | Main Menu | Entry point |
| `/board` | Client Board | Job board + shop access |
| `/mission/:levelId` | Mission Screen | Redirects to `/board` if level is locked |
| `/shop` | Shop | |

Game state is owned by Zustand stores, not derived from URL params. Routes are for navigation only. Navigation guards prevent accessing locked levels via direct URL.

## Level Data Model

Each level is a self-contained TypeScript object:

```typescript
interface Level {
  id: string
  title: string             // contract title, e.g. "Fix the Header"
  client: {
    name: string            // e.g. "Bob's Bakery"
    avatar: string          // client portrait asset path
    brief: string           // e.g. "My website header is all messed up!"
    completionMessage: string // "Thanks! My site looks great now!"
    hintMessage?: string      // extra hint revealed by Client Call shop item
  }
  difficulty: 1 | 2 | 3 | 4 | 5
  payout: number
  prerequisites: string[]   // level IDs that must be completed first
  html: string              // fixed HTML (player doesn't edit this)
  buggyCSS: string          // what the player starts with
  solutionCSS: string       // reference solution (used by Bug Detector and Solution Peek)
  bugLines: number[]        // line numbers in buggyCSS that contain bugs (used by Bug Detector)
  tests: Test[]
}

interface Test {
  id: string
  description: string       // e.g. "Header should be fixed to the top"
  assertions: Assertion[]   // one or more property checks — all must pass
}

interface Assertion {
  selector: string          // CSS selector, e.g. ".header"
  property: string          // CSS property, e.g. "position"
  expected: string          // expected computed value in canonical form (see below)
}
```

### Compound Assertions

A single `Test` can have multiple assertions. The test passes only when all its assertions pass. This allows conceptual requirements like "header is fixed to the top" to map to a single test with assertions for both `position: fixed` and `top: 0px`, rather than leaking implementation details to the player.

### Computed Value Canonical Forms

All `expected` values in assertions must use the browser's `getComputedStyle` canonical form:
- Colors: always `rgb(R, G, B)` or `rgba(R, G, B, A)` — never hex, named colors, or hsl
- Font weight: always numeric (`400`, `700`) — never `normal` or `bold`
- Lengths: always `px` values — `getComputedStyle` resolves `em`, `rem`, `%` to px
- Zero values: `0px` (with unit)
- Shorthand properties: not queryable via `getComputedStyle` — always use longhand (`margin-top`, not `margin`)

The test runner uses exact string comparison. No normalization layer — level authors are responsible for writing expected values in canonical form. A brief reference of common gotchas is included in the level authoring guide.

The player doesn't need to match the exact solution CSS — any CSS that makes all tests pass is a valid solution. Creative solutions are rewarded.

## Architecture: iframe + Monaco

- Player edits CSS in Monaco editor
- Live preview renders in an `<iframe>` using `srcdoc`
- The iframe uses `sandbox="allow-same-origin"` — this enables `contentDocument` access for the test runner while still blocking scripts, forms, and navigation in the preview
- All content is local — works fully offline
- iframe loads the level's HTML template + the player's current CSS

### iframe Communication

The test runner accesses the iframe via `iframeRef.contentDocument` (direct DOM access). This is possible because:
1. `srcdoc` iframes are same-origin by default
2. The `sandbox="allow-same-origin"` flag preserves same-origin access
3. No scripts run inside the iframe (sandbox blocks them), so the preview is safe

No `postMessage` is needed. The test runner directly queries the iframe's DOM.

## Test Runner

On every CSS change (debounced ~300ms):

1. Update the iframe's `srcdoc` with the level HTML + player's current CSS wrapped in a `<style>` tag
2. Wait for iframe to load (`onload` event)
3. For each test, iterate its assertions:
   - Query `selector` in `iframeRef.contentDocument`
   - Call `getComputedStyle(element)[property]` and compare against `expected` (exact string match)
   - If any assertion fails, the test fails
4. Update the test panel — green check or red X per test
5. When all tests pass → enable "Submit" button → on click, show Level Complete modal

### Edge Cases
- Invalid/unparseable CSS: iframe still renders (browser ignores bad CSS), tests stay red
- Selector doesn't match any element: assertion fails with "element not found" message
- Debouncing prevents excessive re-renders during rapid typing

## Economy & Shop System

### Earning Money
- Each level has a fixed payout on first completion only
- Replaying a completed level awards no additional money

### Shop Items (Functional Upgrades)

| Tool | Effect | Price | Implementation |
|------|--------|-------|----------------|
| Syntax Highlighter+ | Enables Monaco's CSS autocomplete and hover info (disabled by default in-game for challenge) | $50 | Toggle Monaco's `suggest.showProperties` and `hover.enabled` options |
| Bug Detector | Highlights lines in the editor that contain bugs — yellow gutter markers on `bugLines` from level data | $150 | Uses Monaco's `deltaDecorations` API to mark `level.bugLines` with gutter icons |
| Property Hint | Reveals which CSS properties the failing tests are checking (normally hidden — tests only show description) | $150 | Test panel shows `assertion.property` names alongside the test description |
| Solution Peek | Shows the correct value for one failing assertion — single use, consumable. Uses `solutionCSS` to extract the expected value context | $100 each | Parses `solutionCSS` and shows the relevant line for one selected failing test |
| Client Call | Reveals an extra hint sentence from the client — stored as `client.hintMessage` in level data (added to Level interface) | $50 | Displays `level.client.hintMessage` in the brief panel |

### Economy Balance

Level payouts scale with difficulty:

| Difficulty | Payout |
|------------|--------|
| 1 | $100 |
| 2 | $150 |
| 3 | $200 |
| 4 | $300 |
| 5 | $400 |

This means a player can afford Syntax Highlighter+ after 1 easy level, Bug Detector after 2-3 levels, and Solution Peek is a meaningful per-use cost (~half a level's payout).

### Player State (persisted to localStorage)

- Money balance
- Completed levels (set of level IDs)
- Owned tools (set of tool IDs)
- Per-level best time (optional)
- In-progress CSS per level (so refreshing the browser doesn't lose work)

## Zustand Store Interfaces

```typescript
// gameStore.ts — persistent player state
interface GameStore {
  money: number
  completedLevels: string[]
  ownedTools: string[]
  inProgressCSS: Record<string, string>  // levelId → current CSS text
  bestTimes: Record<string, number>       // levelId → seconds

  completeLevel: (levelId: string, payout: number, time: number) => void
  buyTool: (toolId: string, price: number) => void
  saveProgress: (levelId: string, css: string) => void  // called on every debounced CSS update (~300ms, same cadence as test runner)
  resetGame: () => void
}

// levelStore.ts — transient state for the active mission
interface LevelStore {
  currentLevel: Level | null
  currentCSS: string
  testResults: TestResult[]   // derived from running tests
  allPassed: boolean          // derived: all testResults are passing
  elapsedTime: number         // seconds since level started

  loadLevel: (level: Level, savedCSS?: string) => void
  updateCSS: (css: string) => void
  updateTestResults: (results: TestResult[]) => void
  reset: () => void
}

interface TestResult {
  testId: string
  passed: boolean
  failedAssertion?: string   // human-readable reason if failed
}
```

`gameStore` syncs to localStorage on every mutation. `levelStore` is ephemeral — reset when navigating away from a mission.

## Difficulty Progression

Scales in two dimensions simultaneously:

1. **Bug complexity:** Single-property bugs (wrong `color`, missing `display: flex`) → multi-property bugs → layout/positioning bugs requiring understanding of property interactions
2. **Bug quantity:** Fewer tests per level early on (1-2 things to fix) → more tests per level later (5-6 things broken in one file)

## Project Structure

```
debuger/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # Router + global providers
│   ├── screens/
│   │   ├── MainMenu.tsx
│   │   ├── ClientBoard.tsx
│   │   ├── Mission.tsx
│   │   └── Shop.tsx
│   ├── components/
│   │   ├── CodeEditor.tsx      # Monaco wrapper
│   │   ├── LivePreview.tsx     # iframe renderer
│   │   ├── TestPanel.tsx       # test results display
│   │   ├── ClientBrief.tsx     # story/brief display
│   │   └── LevelCompleteModal.tsx
│   ├── engine/
│   │   ├── testRunner.ts       # runs tests against iframe DOM
│   │   └── cssInjector.ts      # builds srcdoc HTML string
│   ├── store/
│   │   ├── gameStore.ts        # Zustand — player state, money, progress
│   │   └── levelStore.ts       # current mission state
│   ├── data/
│   │   └── levels/
│   │       ├── index.ts        # level registry
│   │       ├── level-01.ts
│   │       └── level-02.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── storage.ts          # localStorage persistence helpers
```

## Key Dependencies
- React + TypeScript
- Vite
- Monaco Editor (`@monaco-editor/react`)
- Zustand
- React Router

No backend. Everything runs client-side.

## Phase 1 Scope (CSS Bugs Only)

### In Scope
- Main menu, client board, mission screen, shop — all functional
- Level complete modal with payout and replay
- 5-8 CSS bug levels with increasing difficulty
- Test runner with live feedback and compound assertions
- Economy system with concrete pricing and 3-4 shop items
- Local storage persistence including in-progress CSS
- Story/client briefs for each level
- Route guards for locked levels

### Out of Scope
- Algorithm bugs, frontend JS bugs
- Sound/music, animations on test pass (Phase 2 polish)
- Steam/Electron/Tauri packaging
- Leaderboards
- Multiple save slots
- Level authoring tools

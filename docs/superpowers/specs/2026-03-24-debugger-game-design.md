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
- Each contract displays: client name, brief description, difficulty (1-5), payout
- Locked contracts require completing prerequisites or earning enough money

### 3. Mission Screen (Gameplay)
The main gameplay screen, split into panels:
- **Left panel:** Monaco code editor with the buggy CSS
- **Right panel (top):** Live preview iframe showing the rendered result
- **Right panel (bottom):** Test cases panel — list of tests with red/green status updating in real-time
- **Top bar:** Client brief (story context), optional timer, submit button

### 4. Shop
- Spend earnings on functional tool upgrades

## Level Data Model

Each level is a self-contained TypeScript object:

```typescript
interface Level {
  id: string
  client: {
    name: string          // e.g. "Bob's Bakery"
    avatar: string        // client portrait asset path
    brief: string         // e.g. "My website header is all messed up!"
  }
  difficulty: 1 | 2 | 3 | 4 | 5
  payout: number
  prerequisites: string[] // level IDs that must be completed first
  html: string            // fixed HTML (player doesn't edit this)
  buggyCSS: string        // what the player starts with
  solutionCSS: string     // reference solution (used for hints)
  tests: Test[]
}

interface Test {
  id: string
  description: string     // e.g. "Header should be fixed to the top"
  selector: string        // CSS selector, e.g. ".header"
  property: string        // CSS property, e.g. "position"
  expected: string        // expected computed value, e.g. "fixed"
}
```

The player doesn't need to match the exact solution CSS — any CSS that makes all tests pass is a valid solution. Creative solutions are rewarded.

## Architecture: Sandboxed iframe + Monaco

- Player edits CSS in Monaco editor
- Live preview renders in a sandboxed `<iframe>` using `srcdoc` or blob URLs
- All content is local — works fully offline
- iframe loads the level's HTML template + the player's current CSS

## Test Runner

On every CSS change (debounced ~300ms):

1. Inject player's CSS into the iframe via `srcdoc` or updating a `<style>` tag
2. Wait for iframe to render (`requestAnimationFrame`)
3. Query each test's `selector` in the iframe DOM
4. Call `getComputedStyle(element)[property]` and compare against `expected`
5. Update the test panel — green check or red X per test
6. When all tests pass → level complete → show payout screen

### Edge Cases
- Invalid/unparseable CSS: iframe still renders (browser ignores bad CSS), tests stay red
- Selector doesn't match any element: test fails with "element not found" message
- Debouncing prevents excessive re-renders during rapid typing

## Economy & Shop System

### Earning Money
- Each level has a fixed payout on first completion
- Bonus money for completing under par time (optional stretch goal)

### Shop Items (Functional Upgrades)

| Tool | Effect | Price Tier |
|------|--------|------------|
| Syntax Highlighter+ | Enhanced CSS autocomplete in the editor | Cheap |
| Bug Detector | Highlights the lines that contain bugs (not the fix, just the location) | Medium |
| Property Hint | Reveals which CSS property a failing test is checking | Medium |
| Solution Peek | Shows the correct value for one test — single use, consumable | Expensive |
| Client Call | Get an extra hint sentence from the "client" about what's wrong | Cheap |

### Player State (persisted to localStorage)
- Money balance
- Completed levels
- Owned tools
- Per-level best time (optional)

## Difficulty Progression

Scales in two dimensions simultaneously:

1. **Bug complexity:** Single-property bugs (wrong `color`, missing `display: flex`) → multi-property bugs → layout/positioning bugs requiring understanding of property interactions
2. **Bug quantity:** Fewer tests per level early on (1-2 things to fix) → more tests per level later (5-6 things broken in one file)

## Project Structure

```
debugger/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── screens/
│   │   ├── MainMenu.tsx
│   │   ├── ClientBoard.tsx
│   │   ├── Mission.tsx
│   │   └── Shop.tsx
│   ├── components/
│   │   ├── CodeEditor.tsx      # Monaco wrapper
│   │   ├── LivePreview.tsx     # iframe renderer
│   │   ├── TestPanel.tsx       # test results display
│   │   └── ClientBrief.tsx     # story/brief display
│   ├── engine/
│   │   ├── testRunner.ts       # runs tests against iframe DOM
│   │   └── cssInjector.ts      # injects CSS into iframe
│   ├── store/
│   │   ├── gameStore.ts        # Zustand — player state, money, progress
│   │   └── levelStore.ts       # current level state
│   ├── data/
│   │   └── levels/
│   │       ├── index.ts        # level registry
│   │       ├── level-01.ts
│   │       └── level-02.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── storage.ts          # localStorage persistence
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
- 5-8 CSS bug levels with increasing difficulty
- Test runner with live feedback
- Economy system with 3-4 shop items
- Local storage persistence
- Story/client briefs for each level

### Out of Scope
- Algorithm bugs, frontend JS bugs
- Sound/music
- Steam/Electron/Tauri packaging
- Leaderboards
- Multiple save slots

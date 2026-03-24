# Debugger Game Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 of a story-driven CSS debugging game — a freelance developer fixes buggy CSS on client websites, earns money, and buys tool upgrades.

**Architecture:** React SPA with Monaco editor for CSS editing, sandboxed iframe for live preview, and a custom test runner that validates CSS fixes via `getComputedStyle`. Zustand manages game state with localStorage persistence. All levels are bundled static data — no backend.

**Tech Stack:** React 19, TypeScript, Vite, Monaco Editor (`@monaco-editor/react`), Zustand, React Router v6, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-24-debugger-game-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Scaffold Vite project**

Run:
```bash
cd /Users/kristampswang/Desktop/temp/debuger
npm create vite@latest . -- --template react-ts
```

If prompted about existing files, allow overwrite (only docs/ exists).

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom zustand @monaco-editor/react
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Verify setup**

Run: `npm run dev` — should show default Vite React page.
Run: `npx vitest run` — should pass with 0 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS project with dependencies"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write all type interfaces**

Create `src/types/index.ts`:

```typescript
// --- Level Data ---

export interface Assertion {
  selector: string
  property: string
  expected: string
}

export interface Test {
  id: string
  description: string
  assertions: Assertion[]
}

export interface Level {
  id: string
  title: string
  client: {
    name: string
    avatar: string
    brief: string
    completionMessage: string
    hintMessage?: string
  }
  difficulty: 1 | 2 | 3 | 4 | 5
  payout: number
  prerequisites: string[]
  html: string
  buggyCSS: string
  solutionCSS: string
  bugLines: number[]
  tests: Test[]
}

// --- Store Types ---

export interface TestResult {
  testId: string
  passed: boolean
  failedAssertion?: string
}

export type ToolId =
  | 'syntax-highlighter'
  | 'bug-detector'
  | 'property-hint'
  | 'solution-peek'
  | 'client-call'

export interface ShopItem {
  id: ToolId
  name: string
  description: string
  price: number
  consumable: boolean
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'syntax-highlighter',
    name: 'Syntax Highlighter+',
    description: 'Enables CSS autocomplete and hover info in the editor.',
    price: 50,
    consumable: false,
  },
  {
    id: 'bug-detector',
    name: 'Bug Detector',
    description: 'Highlights lines that contain bugs with yellow gutter markers.',
    price: 150,
    consumable: false,
  },
  {
    id: 'property-hint',
    name: 'Property Hint',
    description: 'Reveals which CSS properties the failing tests are checking.',
    price: 150,
    consumable: false,
  },
  {
    id: 'solution-peek',
    name: 'Solution Peek',
    description: 'Shows the correct value for one failing assertion. Single use.',
    price: 100,
    consumable: true,
  },
  {
    id: 'client-call',
    name: 'Client Call',
    description: 'Reveals an extra hint from the client about what\'s wrong.',
    price: 50,
    consumable: false,
  },
]
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add type definitions for levels, tests, store, and shop items"
```

---

## Task 3: Game Store (Zustand + localStorage)

**Files:**
- Create: `src/store/gameStore.ts`, `src/store/__tests__/gameStore.test.ts`

- [ ] **Step 1: Write failing tests for gameStore**

Create `src/store/__tests__/gameStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('starts with default state', () => {
    const state = useGameStore.getState()
    expect(state.money).toBe(0)
    expect(state.completedLevels).toEqual([])
    expect(state.ownedTools).toEqual([])
    expect(state.inProgressCSS).toEqual({})
    expect(state.bestTimes).toEqual({})
  })

  it('completeLevel adds money and marks level complete', () => {
    useGameStore.getState().completeLevel('level-01', 100, 45)
    const state = useGameStore.getState()
    expect(state.money).toBe(100)
    expect(state.completedLevels).toContain('level-01')
    expect(state.bestTimes['level-01']).toBe(45)
  })

  it('completeLevel does not double-pay for already completed levels', () => {
    useGameStore.getState().completeLevel('level-01', 100, 45)
    useGameStore.getState().completeLevel('level-01', 100, 30)
    const state = useGameStore.getState()
    expect(state.money).toBe(100)
    expect(state.bestTimes['level-01']).toBe(30) // best time still updates
  })

  it('buyTool deducts money and adds tool', () => {
    useGameStore.getState().completeLevel('level-01', 200, 45)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    const state = useGameStore.getState()
    expect(state.money).toBe(150)
    expect(state.ownedTools).toContain('syntax-highlighter')
  })

  it('buyTool fails if not enough money', () => {
    useGameStore.getState().buyTool('bug-detector', 150)
    const state = useGameStore.getState()
    expect(state.money).toBe(0)
    expect(state.ownedTools).not.toContain('bug-detector')
  })

  it('buyTool prevents duplicate non-consumable purchases', () => {
    useGameStore.getState().completeLevel('level-01', 300, 45)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    const state = useGameStore.getState()
    expect(state.money).toBe(250) // only deducted once
    expect(state.ownedTools.filter((t) => t === 'syntax-highlighter')).toHaveLength(1)
  })

  it('saveProgress stores CSS for a level', () => {
    useGameStore.getState().saveProgress('level-01', '.header { color: red; }')
    const state = useGameStore.getState()
    expect(state.inProgressCSS['level-01']).toBe('.header { color: red; }')
  })

  it('resetGame clears all state', () => {
    useGameStore.getState().completeLevel('level-01', 100, 45)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    useGameStore.getState().resetGame()
    const state = useGameStore.getState()
    expect(state.money).toBe(0)
    expect(state.completedLevels).toEqual([])
    expect(state.ownedTools).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/store/__tests__/gameStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement gameStore**

Create `src/store/gameStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameState {
  money: number
  completedLevels: string[]
  ownedTools: string[]
  inProgressCSS: Record<string, string>
  bestTimes: Record<string, number>
}

interface GameActions {
  completeLevel: (levelId: string, payout: number, time: number) => void
  buyTool: (toolId: string, price: number) => void
  saveProgress: (levelId: string, css: string) => void
  resetGame: () => void
}

const initialState: GameState = {
  money: 0,
  completedLevels: [],
  ownedTools: [],
  inProgressCSS: {},
  bestTimes: {},
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeLevel: (levelId, payout, time) => {
        const state = get()
        const alreadyCompleted = state.completedLevels.includes(levelId)

        set({
          money: alreadyCompleted ? state.money : state.money + payout,
          completedLevels: alreadyCompleted
            ? state.completedLevels
            : [...state.completedLevels, levelId],
          bestTimes: {
            ...state.bestTimes,
            [levelId]:
              state.bestTimes[levelId] !== undefined
                ? Math.min(state.bestTimes[levelId], time)
                : time,
          },
        })
      },

      buyTool: (toolId, price) => {
        const state = get()
        if (state.money < price) return
        if (state.ownedTools.includes(toolId)) return // prevent duplicate non-consumable purchases
        set({
          money: state.money - price,
          ownedTools: [...state.ownedTools, toolId],
        })
      },

      saveProgress: (levelId, css) => {
        set({
          inProgressCSS: { ...get().inProgressCSS, [levelId]: css },
        })
      },

      resetGame: () => set(initialState),
    }),
    {
      name: 'debugger-game-save',
    }
  )
)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/store/__tests__/gameStore.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts src/store/__tests__/gameStore.test.ts
git commit -m "feat: add gameStore with persistence and tests"
```

---

## Task 4: Level Store

**Files:**
- Create: `src/store/levelStore.ts`, `src/store/__tests__/levelStore.test.ts`

- [ ] **Step 1: Write failing tests for levelStore**

Create `src/store/__tests__/levelStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useLevelStore } from '../levelStore'
import type { Level, TestResult } from '../../types'

const mockLevel: Level = {
  id: 'test-level',
  title: 'Test Level',
  client: {
    name: 'Test Client',
    avatar: '',
    brief: 'Fix the bug',
    completionMessage: 'Thanks!',
  },
  difficulty: 1,
  payout: 100,
  prerequisites: [],
  html: '<div class="box">Hello</div>',
  buggyCSS: '.box { color: blue; }',
  solutionCSS: '.box { color: red; }',
  bugLines: [1],
  tests: [
    {
      id: 'test-1',
      description: 'Box should be red',
      assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
    },
  ],
}

describe('levelStore', () => {
  beforeEach(() => {
    useLevelStore.getState().reset()
  })

  it('starts with null level', () => {
    const state = useLevelStore.getState()
    expect(state.currentLevel).toBeNull()
    expect(state.currentCSS).toBe('')
    expect(state.testResults).toEqual([])
    expect(state.allPassed).toBe(false)
  })

  it('loadLevel sets level and buggy CSS', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    const state = useLevelStore.getState()
    expect(state.currentLevel).toEqual(mockLevel)
    expect(state.currentCSS).toBe('.box { color: blue; }')
  })

  it('loadLevel uses saved CSS if provided', () => {
    useLevelStore.getState().loadLevel(mockLevel, '.box { color: green; }')
    expect(useLevelStore.getState().currentCSS).toBe('.box { color: green; }')
  })

  it('updateCSS changes current CSS', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    useLevelStore.getState().updateCSS('.box { color: red; }')
    expect(useLevelStore.getState().currentCSS).toBe('.box { color: red; }')
  })

  it('updateTestResults sets results and computes allPassed', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    const results: TestResult[] = [{ testId: 'test-1', passed: true }]
    useLevelStore.getState().updateTestResults(results)
    const state = useLevelStore.getState()
    expect(state.testResults).toEqual(results)
    expect(state.allPassed).toBe(true)
  })

  it('allPassed is false when any test fails', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    const results: TestResult[] = [{ testId: 'test-1', passed: false, failedAssertion: 'color mismatch' }]
    useLevelStore.getState().updateTestResults(results)
    expect(useLevelStore.getState().allPassed).toBe(false)
  })

  it('reset clears everything', () => {
    useLevelStore.getState().loadLevel(mockLevel)
    useLevelStore.getState().reset()
    expect(useLevelStore.getState().currentLevel).toBeNull()
    expect(useLevelStore.getState().currentCSS).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/store/__tests__/levelStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement levelStore**

Create `src/store/levelStore.ts`:

```typescript
import { create } from 'zustand'
import type { Level, TestResult } from '../types'

interface LevelState {
  currentLevel: Level | null
  currentCSS: string
  testResults: TestResult[]
  allPassed: boolean
  elapsedTime: number
}

interface LevelActions {
  loadLevel: (level: Level, savedCSS?: string) => void
  updateCSS: (css: string) => void
  updateTestResults: (results: TestResult[]) => void
  tick: () => void
  reset: () => void
}

const initialState: LevelState = {
  currentLevel: null,
  currentCSS: '',
  testResults: [],
  allPassed: false,
  elapsedTime: 0,
}

export const useLevelStore = create<LevelState & LevelActions>()((set) => ({
  ...initialState,

  loadLevel: (level, savedCSS) =>
    set({
      currentLevel: level,
      currentCSS: savedCSS ?? level.buggyCSS,
      testResults: [],
      allPassed: false,
      elapsedTime: 0,
    }),

  updateCSS: (css) => set({ currentCSS: css }),

  updateTestResults: (results) =>
    set({
      testResults: results,
      allPassed: results.length > 0 && results.every((r) => r.passed),
    }),

  tick: () => set((state) => ({ elapsedTime: state.elapsedTime + 1 })),

  reset: () => set(initialState),
}))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/store/__tests__/levelStore.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/levelStore.ts src/store/__tests__/levelStore.test.ts
git commit -m "feat: add levelStore for transient mission state with tests"
```

---

## Task 5: CSS Injector Engine

**Files:**
- Create: `src/engine/cssInjector.ts`, `src/engine/__tests__/cssInjector.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/cssInjector.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildSrcdoc } from '../cssInjector'

describe('buildSrcdoc', () => {
  it('wraps HTML and CSS into a complete document', () => {
    const result = buildSrcdoc('<div>Hello</div>', '.div { color: red; }')
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<div>Hello</div>')
    expect(result).toContain('.div { color: red; }')
  })

  it('puts CSS in a style tag inside the head', () => {
    const result = buildSrcdoc('<p>Test</p>', 'p { margin: 0; }')
    expect(result).toMatch(/<head>[\s\S]*<style>p \{ margin: 0; \}<\/style>[\s\S]*<\/head>/)
  })

  it('puts HTML in the body', () => {
    const result = buildSrcdoc('<p>Test</p>', 'p { margin: 0; }')
    expect(result).toMatch(/<body>[\s\S]*<p>Test<\/p>[\s\S]*<\/body>/)
  })

  it('handles empty CSS', () => {
    const result = buildSrcdoc('<div>Hi</div>', '')
    expect(result).toContain('<style></style>')
    expect(result).toContain('<div>Hi</div>')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/cssInjector.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement cssInjector**

Create `src/engine/cssInjector.ts`:

```typescript
export function buildSrcdoc(html: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${css}</style>
</head>
<body>
${html}
</body>
</html>`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/cssInjector.test.ts`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/cssInjector.ts src/engine/__tests__/cssInjector.test.ts
git commit -m "feat: add cssInjector engine to build iframe srcdoc"
```

---

## Task 6: Test Runner Engine

**Files:**
- Create: `src/engine/testRunner.ts`, `src/engine/__tests__/testRunner.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/testRunner.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { runTests } from '../testRunner'
import type { Test } from '../../types'

// Helper: create a minimal document with computed styles
function createMockDocument(styles: Record<string, Record<string, string>>) {
  const elements: Record<string, { props: Record<string, string> }> = {}
  for (const [selector, props] of Object.entries(styles)) {
    elements[selector] = { props }
  }

  return {
    querySelector: (selector: string) => elements[selector] ?? null,
    defaultView: {
      getComputedStyle: (el: { props: Record<string, string> }) => ({
        getPropertyValue: (prop: string) => el.props[prop] ?? '',
      }),
    },
  } as unknown as Document
}

describe('runTests', () => {
  it('returns passing result when assertion matches', () => {
    const doc = createMockDocument({
      '.box': { color: 'rgb(255, 0, 0)' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Box is red',
        assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
    ]
    const results = runTests(tests, doc)
    expect(results).toEqual([{ testId: 'test-1', passed: true }])
  })

  it('returns failing result when assertion does not match', () => {
    const doc = createMockDocument({
      '.box': { color: 'rgb(0, 0, 255)' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Box is red',
        assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(false)
    expect(results[0].failedAssertion).toBeDefined()
  })

  it('fails when selector not found', () => {
    const doc = createMockDocument({})
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Box is red',
        assertions: [{ selector: '.missing', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(false)
    expect(results[0].failedAssertion).toContain('element not found')
  })

  it('passes compound assertions only when all match', () => {
    const doc = createMockDocument({
      '.header': { position: 'fixed', top: '0px' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Header fixed to top',
        assertions: [
          { selector: '.header', property: 'position', expected: 'fixed' },
          { selector: '.header', property: 'top', expected: '0px' },
        ],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(true)
  })

  it('fails compound assertions when one does not match', () => {
    const doc = createMockDocument({
      '.header': { position: 'fixed', top: '10px' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Header fixed to top',
        assertions: [
          { selector: '.header', property: 'position', expected: 'fixed' },
          { selector: '.header', property: 'top', expected: '0px' },
        ],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(false)
  })

  it('runs multiple tests independently', () => {
    const doc = createMockDocument({
      '.box': { color: 'rgb(255, 0, 0)' },
      '.title': { 'font-weight': '400' },
    })
    const tests: Test[] = [
      {
        id: 'test-1',
        description: 'Box is red',
        assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
      },
      {
        id: 'test-2',
        description: 'Title is bold',
        assertions: [{ selector: '.title', property: 'font-weight', expected: '700' }],
      },
    ]
    const results = runTests(tests, doc)
    expect(results[0].passed).toBe(true)
    expect(results[1].passed).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/testRunner.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement testRunner**

Create `src/engine/testRunner.ts`:

```typescript
import type { Test, TestResult } from '../types'

export function runTests(tests: Test[], doc: Document): TestResult[] {
  return tests.map((test) => {
    for (const assertion of test.assertions) {
      const element = doc.querySelector(assertion.selector)
      if (!element) {
        return {
          testId: test.id,
          passed: false,
          failedAssertion: `"${assertion.selector}" — element not found`,
        }
      }

      const computed = doc.defaultView!.getComputedStyle(element)
      const actual = computed.getPropertyValue(assertion.property)

      if (actual !== assertion.expected) {
        return {
          testId: test.id,
          passed: false,
          failedAssertion: `"${assertion.selector}" ${assertion.property}: expected "${assertion.expected}", got "${actual}"`,
        }
      }
    }

    return { testId: test.id, passed: true }
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/testRunner.test.ts`
Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/testRunner.ts src/engine/__tests__/testRunner.test.ts
git commit -m "feat: add test runner engine with compound assertion support"
```

---

## Task 7: Level Data (First 3 Levels)

**Files:**
- Create: `src/data/levels/level-01.ts`, `src/data/levels/level-02.ts`, `src/data/levels/level-03.ts`, `src/data/levels/index.ts`

- [ ] **Step 1: Create Level 1 — "Bob's Bakery" (difficulty 1, single color bug)**

Create `src/data/levels/level-01.ts`:

```typescript
import type { Level } from '../../types'

const level: Level = {
  id: 'level-01',
  title: "Fix the Menu Colors",
  client: {
    name: "Bob's Bakery",
    avatar: '',
    brief: "Help! I just launched my bakery website but the text colors are all wrong. My customers can't read the menu!",
    completionMessage: "The menu looks perfect now! Thanks a bunch, here's your payment.",
    hintMessage: "I think the heading and the menu items have the wrong colors.",
  },
  difficulty: 1,
  payout: 100,
  prerequisites: [],
  html: `<div class="bakery">
  <h1 class="title">Bob's Bakery</h1>
  <ul class="menu">
    <li class="menu-item">Croissant - $3.50</li>
    <li class="menu-item">Sourdough Loaf - $6.00</li>
    <li class="menu-item">Cinnamon Roll - $4.00</li>
  </ul>
  <p class="footer">Open daily 7am - 5pm</p>
</div>`,
  buggyCSS: `.bakery {
  font-family: Georgia, serif;
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  background-color: rgb(255, 248, 240);
}

.title {
  color: rgb(255, 248, 240);
  text-align: center;
  margin-bottom: 16px;
}

.menu {
  list-style: none;
  padding: 0;
}

.menu-item {
  padding: 8px 0;
  color: rgb(255, 248, 240);
  border-bottom: 1px solid rgb(221, 204, 187);
}

.footer {
  text-align: center;
  color: rgb(153, 119, 85);
  margin-top: 16px;
  font-size: 14px;
}`,
  solutionCSS: `.bakery {
  font-family: Georgia, serif;
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  background-color: rgb(255, 248, 240);
}

.title {
  color: rgb(139, 90, 43);
  text-align: center;
  margin-bottom: 16px;
}

.menu {
  list-style: none;
  padding: 0;
}

.menu-item {
  padding: 8px 0;
  color: rgb(51, 51, 51);
  border-bottom: 1px solid rgb(221, 204, 187);
}

.footer {
  text-align: center;
  color: rgb(153, 119, 85);
  margin-top: 16px;
  font-size: 14px;
}`,
  bugLines: [10, 23],
  tests: [
    {
      id: 'test-title-color',
      description: 'Title text should be visible (dark brown)',
      assertions: [
        { selector: '.title', property: 'color', expected: 'rgb(139, 90, 43)' },
      ],
    },
    {
      id: 'test-menu-color',
      description: 'Menu items should be readable (dark text)',
      assertions: [
        { selector: '.menu-item', property: 'color', expected: 'rgb(51, 51, 51)' },
      ],
    },
  ],
}

export default level
```

- [ ] **Step 2: Create Level 2 — "Flex Fitness" (difficulty 2, layout bug)**

Create `src/data/levels/level-02.ts`:

```typescript
import type { Level } from '../../types'

const level: Level = {
  id: 'level-02',
  title: "Fix the Layout",
  client: {
    name: "Flex Fitness",
    avatar: '',
    brief: "Our class schedule page is a mess. The cards should be in a row, not stacked on top of each other. And the header is supposed to stick to the top!",
    completionMessage: "Now our members can actually find their classes. Much appreciated!",
    hintMessage: "Check the container's display property and the header's position.",
  },
  difficulty: 2,
  payout: 150,
  prerequisites: ['level-01'],
  html: `<header class="header">
  <h1>Flex Fitness</h1>
</header>
<div class="card-container">
  <div class="card">
    <h3>Yoga</h3>
    <p>Mon/Wed 9am</p>
  </div>
  <div class="card">
    <h3>HIIT</h3>
    <p>Tue/Thu 6pm</p>
  </div>
  <div class="card">
    <h3>Spin</h3>
    <p>Fri 7am</p>
  </div>
</div>`,
  buggyCSS: `.header {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  padding: 16px;
  text-align: center;
  position: relative;
  top: auto;
  width: 100%;
}

.card-container {
  display: block;
  padding: 20px;
  gap: 16px;
  margin-top: 80px;
}

.card {
  background-color: rgb(245, 245, 245);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  flex: 1;
}`,
  solutionCSS: `.header {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  padding: 16px;
  text-align: center;
  position: fixed;
  top: 0px;
  width: 100%;
}

.card-container {
  display: flex;
  padding: 20px;
  gap: 16px;
  margin-top: 80px;
}

.card {
  background-color: rgb(245, 245, 245);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  flex: 1;
}`,
  bugLines: [6, 7, 12],
  tests: [
    {
      id: 'test-header-fixed',
      description: 'Header should be fixed to the top of the page',
      assertions: [
        { selector: '.header', property: 'position', expected: 'fixed' },
        { selector: '.header', property: 'top', expected: '0px' },
      ],
    },
    {
      id: 'test-cards-flex',
      description: 'Cards should be displayed in a horizontal row',
      assertions: [
        { selector: '.card-container', property: 'display', expected: 'flex' },
      ],
    },
  ],
}

export default level
```

- [ ] **Step 3: Create Level 3 — "Pixel Portfolio" (difficulty 3, spacing + visibility bugs)**

Create `src/data/levels/level-03.ts`:

```typescript
import type { Level } from '../../types'

const level: Level = {
  id: 'level-03',
  title: "Fix the Portfolio Grid",
  client: {
    name: "Pixel Portfolio",
    avatar: '',
    brief: "I'm a photographer and my portfolio grid is broken. The images should be in a nice grid, the nav links need proper spacing, and my bio section is invisible for some reason!",
    completionMessage: "My portfolio finally looks professional! Great debugging work.",
    hintMessage: "There are three separate problems: the grid layout, the nav link spacing, and the bio section visibility.",
  },
  difficulty: 3,
  payout: 200,
  prerequisites: ['level-02'],
  html: `<nav class="nav">
  <a class="nav-link" href="#">Home</a>
  <a class="nav-link" href="#">Gallery</a>
  <a class="nav-link" href="#">Contact</a>
</nav>
<section class="bio">
  <h2>About Me</h2>
  <p>Capturing moments since 2015.</p>
</section>
<div class="gallery">
  <div class="photo">Photo 1</div>
  <div class="photo">Photo 2</div>
  <div class="photo">Photo 3</div>
  <div class="photo">Photo 4</div>
  <div class="photo">Photo 5</div>
  <div class="photo">Photo 6</div>
</div>`,
  buggyCSS: `.nav {
  display: flex;
  background-color: rgb(30, 30, 30);
  padding: 12px;
}

.nav-link {
  color: rgb(255, 255, 255);
  text-decoration: none;
  margin-right: 0px;
  padding: 8px 0px;
}

.bio {
  padding: 20px;
  text-align: center;
  display: none;
}

.gallery {
  display: block;
  gap: 12px;
  padding: 20px;
}

.photo {
  background-color: rgb(221, 221, 221);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}`,
  solutionCSS: `.nav {
  display: flex;
  background-color: rgb(30, 30, 30);
  padding: 12px;
}

.nav-link {
  color: rgb(255, 255, 255);
  text-decoration: none;
  margin-right: 24px;
  padding: 8px 16px;
}

.bio {
  padding: 20px;
  text-align: center;
  display: block;
}

.gallery {
  display: grid;
  gap: 12px;
  padding: 20px;
  grid-template-columns: repeat(3, 1fr);
}

.photo {
  background-color: rgb(221, 221, 221);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}`,
  bugLines: [10, 11, 17, 21],
  tests: [
    {
      id: 'test-nav-spacing',
      description: 'Nav links should have horizontal spacing between them',
      assertions: [
        { selector: '.nav-link', property: 'margin-right', expected: '24px' },
        { selector: '.nav-link', property: 'padding-left', expected: '16px' },
      ],
    },
    {
      id: 'test-bio-visible',
      description: 'Bio section should be visible',
      assertions: [
        { selector: '.bio', property: 'display', expected: 'block' },
      ],
    },
    {
      id: 'test-gallery-grid',
      description: 'Gallery should use CSS Grid with 3 columns',
      assertions: [
        { selector: '.gallery', property: 'display', expected: 'grid' },
        { selector: '.gallery', property: 'grid-template-columns', expected: 'repeat(3, 1fr)' },
      ],
    },
  ],
}

export default level
```

- [ ] **Step 4: Create level registry**

Create `src/data/levels/index.ts`:

```typescript
import type { Level } from '../../types'
import level01 from './level-01'
import level02 from './level-02'
import level03 from './level-03'

export const levels: Level[] = [level01, level02, level03]

export function getLevelById(id: string): Level | undefined {
  return levels.find((l) => l.id === id)
}
```

- [ ] **Step 5: Verify everything compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/data/levels/
git commit -m "feat: add first 3 levels with level registry"
```

---

## Task 8: App Router + Main Menu Screen

**Files:**
- Create: `src/screens/MainMenu.tsx`, modify `src/App.tsx`

- [ ] **Step 1: Write failing test for MainMenu**

Create `src/screens/__tests__/MainMenu.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MainMenu } from '../MainMenu'

describe('MainMenu', () => {
  it('renders game title', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    )
    expect(screen.getByText('Debugger')).toBeInTheDocument()
  })

  it('renders new game and continue buttons', () => {
    render(
      <MemoryRouter>
        <MainMenu />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /new game/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/screens/__tests__/MainMenu.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement MainMenu**

Create `src/screens/MainMenu.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function MainMenu() {
  const { completedLevels, resetGame } = useGameStore()
  const hasSave = completedLevels.length > 0

  const handleNewGame = () => {
    resetGame()
  }

  return (
    <div className="main-menu">
      <h1>Debugger</h1>
      <p className="subtitle">Fix bugs. Get paid. Buy better tools.</p>
      <nav className="menu-actions">
        <Link to="/board" onClick={handleNewGame} className="menu-btn">
          New Game
        </Link>
        <Link
          to="/board"
          className={`menu-btn ${!hasSave ? 'disabled' : ''}`}
          onClick={(e) => !hasSave && e.preventDefault()}
        >
          Continue
        </Link>
      </nav>
    </div>
  )
}
```

- [ ] **Step 4: Set up App router**

Replace `src/App.tsx` contents:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './screens/MainMenu'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/screens/__tests__/MainMenu.test.tsx`
Expected: All 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/screens/MainMenu.tsx src/screens/__tests__/MainMenu.test.tsx src/App.tsx
git commit -m "feat: add MainMenu screen and app router"
```

---

## Task 9: Client Board Screen

**Files:**
- Create: `src/screens/ClientBoard.tsx`, `src/screens/__tests__/ClientBoard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/screens/__tests__/ClientBoard.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ClientBoard } from '../ClientBoard'
import { useGameStore } from '../../store/gameStore'

describe('ClientBoard', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('renders level cards', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.getByText("Bob's Bakery")).toBeInTheDocument()
    expect(screen.getByText("Fix the Menu Colors")).toBeInTheDocument()
  })

  it('shows first level as unlocked', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const firstCard = screen.getByText("Bob's Bakery").closest('.level-card')
    expect(firstCard).not.toHaveClass('locked')
  })

  it('shows levels with unmet prerequisites as locked', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const secondCard = screen.getByText("Flex Fitness").closest('.level-card')
    expect(secondCard).toHaveClass('locked')
  })

  it('shows player money balance', () => {
    useGameStore.getState().completeLevel('level-01', 100, 30)
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.getByText('$100')).toBeInTheDocument()
  })

  it('renders shop link', () => {
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /shop/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/screens/__tests__/ClientBoard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ClientBoard**

Create `src/screens/ClientBoard.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { levels } from '../data/levels'

export function ClientBoard() {
  const { money, completedLevels } = useGameStore()

  const isLevelUnlocked = (prerequisites: string[]) =>
    prerequisites.every((id) => completedLevels.includes(id))

  return (
    <div className="client-board">
      <header className="board-header">
        <h1>Job Board</h1>
        <div className="board-actions">
          <span className="money">${money}</span>
          <Link to="/shop" className="shop-link">Shop</Link>
          <Link to="/" className="back-link">Menu</Link>
        </div>
      </header>
      <div className="level-grid">
        {levels.map((level) => {
          const unlocked = isLevelUnlocked(level.prerequisites)
          const completed = completedLevels.includes(level.id)

          return (
            <div
              key={level.id}
              className={`level-card ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
            >
              <h3>{level.title}</h3>
              <p className="client-name">{level.client.name}</p>
              <p className="brief">{level.client.brief}</p>
              <div className="level-meta">
                <span className="difficulty">{'★'.repeat(level.difficulty)}</span>
                <span className="payout">${level.payout}</span>
              </div>
              {unlocked ? (
                <Link to={`/mission/${level.id}`} className="start-btn">
                  {completed ? 'Replay' : 'Accept Contract'}
                </Link>
              ) : (
                <span className="locked-label">Locked</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add route to App.tsx**

Add ClientBoard import and route to `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './screens/MainMenu'
import { ClientBoard } from './screens/ClientBoard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/board" element={<ClientBoard />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/screens/__tests__/ClientBoard.test.tsx`
Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/screens/ClientBoard.tsx src/screens/__tests__/ClientBoard.test.tsx src/App.tsx
git commit -m "feat: add ClientBoard screen with level cards and lock logic"
```

---

## Task 10: Core Components — CodeEditor, LivePreview, TestPanel, ClientBrief

**Files:**
- Create: `src/components/CodeEditor.tsx`, `src/components/LivePreview.tsx`, `src/components/TestPanel.tsx`, `src/components/ClientBrief.tsx`

- [ ] **Step 1: Write failing test for TestPanel**

Create `src/components/__tests__/TestPanel.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestPanel } from '../TestPanel'
import type { Test, TestResult } from '../../types'

const tests: Test[] = [
  {
    id: 'test-1',
    description: 'Box is red',
    assertions: [{ selector: '.box', property: 'color', expected: 'rgb(255, 0, 0)' }],
  },
  {
    id: 'test-2',
    description: 'Title is bold',
    assertions: [{ selector: '.title', property: 'font-weight', expected: '700' }],
  },
]

describe('TestPanel', () => {
  it('renders test descriptions', () => {
    render(<TestPanel tests={tests} results={[]} showPropertyHints={false} />)
    expect(screen.getByText('Box is red')).toBeInTheDocument()
    expect(screen.getByText('Title is bold')).toBeInTheDocument()
  })

  it('shows pass/fail status', () => {
    const results: TestResult[] = [
      { testId: 'test-1', passed: true },
      { testId: 'test-2', passed: false, failedAssertion: 'font-weight mismatch' },
    ]
    render(<TestPanel tests={tests} results={results} showPropertyHints={false} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveClass('passed')
    expect(items[1]).toHaveClass('failed')
  })

  it('shows property hints when enabled', () => {
    render(<TestPanel tests={tests} results={[]} showPropertyHints={true} />)
    expect(screen.getByText(/color/)).toBeInTheDocument()
    expect(screen.getByText(/font-weight/)).toBeInTheDocument()
  })

  it('hides property hints when disabled', () => {
    render(<TestPanel tests={tests} results={[]} showPropertyHints={false} />)
    expect(screen.queryByText('color')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/TestPanel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement TestPanel**

Create `src/components/TestPanel.tsx`:

```tsx
import type { Test, TestResult } from '../types'

interface TestPanelProps {
  tests: Test[]
  results: TestResult[]
  showPropertyHints: boolean
}

export function TestPanel({ tests, results, showPropertyHints }: TestPanelProps) {
  const getResult = (testId: string) => results.find((r) => r.testId === testId)

  return (
    <div className="test-panel">
      <h3>Tests</h3>
      <ul className="test-list">
        {tests.map((test) => {
          const result = getResult(test.id)
          const status = result ? (result.passed ? 'passed' : 'failed') : 'pending'

          return (
            <li key={test.id} role="listitem" className={`test-item ${status}`}>
              <span className="test-status">
                {status === 'passed' ? '✓' : status === 'failed' ? '✗' : '○'}
              </span>
              <span className="test-description">{test.description}</span>
              {showPropertyHints && (
                <span className="test-hints">
                  {test.assertions.map((a) => a.property).join(', ')}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Implement LivePreview**

Create `src/components/LivePreview.tsx`:

```tsx
import { useRef, useEffect, useCallback } from 'react'
import { buildSrcdoc } from '../engine/cssInjector'

interface LivePreviewProps {
  html: string
  css: string
  onIframeReady: (doc: Document) => void
}

export function LivePreview({ html, css, onIframeReady }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (doc) {
      onIframeReady(doc)
    }
  }, [onIframeReady])

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = buildSrcdoc(html, css)
    }
  }, [html, css])

  return (
    <div className="live-preview">
      <h3>Preview</h3>
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        title="Live Preview"
        onLoad={handleLoad}
        className="preview-iframe"
      />
    </div>
  )
}
```

- [ ] **Step 5: Implement CodeEditor**

Create `src/components/CodeEditor.tsx`:

```tsx
import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  bugLines?: number[]
  showBugDetector: boolean
  enableAutocomplete: boolean
}

export function CodeEditor({
  value,
  onChange,
  bugLines = [],
  showBugDetector,
  enableAutocomplete,
}: CodeEditorProps) {
  const handleEditorMount = (editor: any, monaco: any) => {
    if (showBugDetector && bugLines.length > 0) {
      const decorations = bugLines.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: 'bug-gutter-icon',
          glyphMarginHoverMessage: { value: '🐛 Bug detected on this line' },
        },
      }))
      editor.deltaDecorations([], decorations)
    }
  }

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        language="css"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          suggest: {
            showProperties: enableAutocomplete,
          },
          hover: {
            enabled: enableAutocomplete,
          },
        }}
      />
    </div>
  )
}
```

- [ ] **Step 6: Implement ClientBrief**

Create `src/components/ClientBrief.tsx`:

```tsx
interface ClientBriefProps {
  clientName: string
  brief: string
  hintMessage?: string
  showHint: boolean
}

export function ClientBrief({ clientName, brief, hintMessage, showHint }: ClientBriefProps) {
  return (
    <div className="client-brief">
      <strong className="client-name">{clientName}</strong>
      <p className="brief-text">{brief}</p>
      {showHint && hintMessage && (
        <p className="hint-text">💡 {hintMessage}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/
git commit -m "feat: add CodeEditor, LivePreview, TestPanel, and ClientBrief components"
```

---

## Task 11: Mission Screen (Core Gameplay)

**Files:**
- Create: `src/screens/Mission.tsx`, `src/components/LevelCompleteModal.tsx`

- [ ] **Step 1: Write failing test for LevelCompleteModal**

Create `src/components/__tests__/LevelCompleteModal.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LevelCompleteModal } from '../LevelCompleteModal'

describe('LevelCompleteModal', () => {
  it('shows payout for first completion', () => {
    render(
      <MemoryRouter>
        <LevelCompleteModal
          clientName="Bob's Bakery"
          completionMessage="Thanks!"
          payout={100}
          time={45}
          alreadyCompleted={false}
          onReplay={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/\$100/)).toBeInTheDocument()
    expect(screen.getByText(/Thanks!/)).toBeInTheDocument()
  })

  it('shows "Already completed" on replay', () => {
    render(
      <MemoryRouter>
        <LevelCompleteModal
          clientName="Bob's Bakery"
          completionMessage="Thanks!"
          payout={100}
          time={30}
          alreadyCompleted={true}
          onReplay={vi.fn()}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/already completed/i)).toBeInTheDocument()
  })

  it('calls onReplay when replay is clicked', async () => {
    const onReplay = vi.fn()
    render(
      <MemoryRouter>
        <LevelCompleteModal
          clientName="Bob's Bakery"
          completionMessage="Thanks!"
          payout={100}
          time={45}
          alreadyCompleted={false}
          onReplay={onReplay}
        />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /replay/i }))
    expect(onReplay).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/LevelCompleteModal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement LevelCompleteModal**

Create `src/components/LevelCompleteModal.tsx`:

```tsx
import { Link } from 'react-router-dom'

interface LevelCompleteModalProps {
  clientName: string
  completionMessage: string
  payout: number
  time: number
  alreadyCompleted: boolean
  onReplay: () => void
}

export function LevelCompleteModal({
  clientName,
  completionMessage,
  payout,
  time,
  alreadyCompleted,
  onReplay,
}: LevelCompleteModalProps) {
  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Level Complete!</h2>
        <p className="client-message">
          <strong>{clientName}:</strong> {completionMessage}
        </p>
        <div className="modal-stats">
          <p>
            Time: {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          {alreadyCompleted ? (
            <p className="already-completed">Already completed</p>
          ) : (
            <p className="payout">+${payout}</p>
          )}
        </div>
        <div className="modal-actions">
          <Link to="/board" className="modal-btn">
            Back to Board
          </Link>
          <button onClick={onReplay} className="modal-btn">
            Replay
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement Mission screen**

Create `src/screens/Mission.tsx`:

```tsx
import { useEffect, useRef, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { useLevelStore } from '../store/levelStore'
import { getLevelById } from '../data/levels'
import { runTests } from '../engine/testRunner'
import { CodeEditor } from '../components/CodeEditor'
import { LivePreview } from '../components/LivePreview'
import { TestPanel } from '../components/TestPanel'
import { ClientBrief } from '../components/ClientBrief'
import { LevelCompleteModal } from '../components/LevelCompleteModal'

export function Mission() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()

  const { completedLevels, ownedTools, inProgressCSS, completeLevel, saveProgress } =
    useGameStore()
  const {
    currentLevel,
    currentCSS,
    testResults,
    allPassed,
    elapsedTime,
    loadLevel,
    updateCSS,
    updateTestResults,
    tick,
    reset,
  } = useLevelStore()

  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const [showComplete, setShowComplete] = useState(false)
  // Capture whether level was already completed ONCE at mount time
  const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false)

  // Load level on mount
  useEffect(() => {
    if (!levelId) return
    const level = getLevelById(levelId)
    if (!level) {
      navigate('/board')
      return
    }
    // Check prerequisites
    const { completedLevels: completed, inProgressCSS: saved } = useGameStore.getState()
    const unlocked = level.prerequisites.every((id) => completed.includes(id))
    if (!unlocked) {
      navigate('/board')
      return
    }
    // Capture completion state before this session
    setWasAlreadyCompleted(completed.includes(levelId))
    loadLevel(level, saved[levelId])

    // Start timer
    timerRef.current = setInterval(() => tick(), 1000)

    return () => {
      clearInterval(timerRef.current)
      reset()
    }
  }, [levelId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced CSS change handler — saves progress and queues a re-render
  // The actual test run happens when the iframe fires onLoad after srcdoc update
  const handleCSSChange = useCallback(
    (css: string) => {
      updateCSS(css)

      // Debounce the save and srcdoc update
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (levelId) saveProgress(levelId, css)
      }, 300)
    },
    [levelId, updateCSS, saveProgress]
  )

  const handleIframeReady = useCallback(
    (doc: Document) => {
      if (!currentLevel) return
      const results = runTests(currentLevel.tests, doc)
      updateTestResults(results)
    },
    [currentLevel, updateTestResults]
  )

  const handleSubmit = () => {
    if (!currentLevel || !allPassed) return
    setShowComplete(true)
    completeLevel(currentLevel.id, currentLevel.payout, elapsedTime)
    clearInterval(timerRef.current)
  }

  const handleReplay = () => {
    if (!currentLevel) return
    setShowComplete(false)
    setWasAlreadyCompleted(true) // after first completion, replays always show "already completed"
    loadLevel(currentLevel)
    timerRef.current = setInterval(() => tick(), 1000)
  }

  if (!currentLevel) return null

  const hasPropertyHint = ownedTools.includes('property-hint')
  const hasBugDetector = ownedTools.includes('bug-detector')
  const hasAutocomplete = ownedTools.includes('syntax-highlighter')
  const hasClientCall = ownedTools.includes('client-call')

  return (
    <div className="mission-screen">
      <div className="mission-topbar">
        <ClientBrief
          clientName={currentLevel.client.name}
          brief={currentLevel.client.brief}
          hintMessage={currentLevel.client.hintMessage}
          showHint={hasClientCall}
        />
        <div className="mission-controls">
          <span className="timer">
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </span>
          <button
            className="submit-btn"
            disabled={!allPassed}
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
      <div className="mission-workspace">
        <div className="mission-left">
          <CodeEditor
            value={currentCSS}
            onChange={handleCSSChange}
            bugLines={currentLevel.bugLines}
            showBugDetector={hasBugDetector}
            enableAutocomplete={hasAutocomplete}
          />
        </div>
        <div className="mission-right">
          <LivePreview
            html={currentLevel.html}
            css={currentCSS}
            onIframeReady={handleIframeReady}
          />
          <TestPanel
            tests={currentLevel.tests}
            results={testResults}
            showPropertyHints={hasPropertyHint}
          />
        </div>
      </div>
      {showComplete && (
        <LevelCompleteModal
          clientName={currentLevel.client.name}
          completionMessage={currentLevel.client.completionMessage}
          payout={currentLevel.payout}
          time={elapsedTime}
          alreadyCompleted={wasAlreadyCompleted}
          onReplay={handleReplay}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Add Mission route to App.tsx**

Update `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './screens/MainMenu'
import { ClientBoard } from './screens/ClientBoard'
import { Mission } from './screens/Mission'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/board" element={<ClientBoard />} />
        <Route path="/mission/:levelId" element={<Mission />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/screens/Mission.tsx src/components/LevelCompleteModal.tsx src/components/__tests__/LevelCompleteModal.test.tsx src/App.tsx
git commit -m "feat: add Mission screen with gameplay loop and LevelCompleteModal"
```

---

## Task 12: Shop Screen

**Files:**
- Create: `src/screens/Shop.tsx`, `src/screens/__tests__/Shop.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/screens/__tests__/Shop.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Shop } from '../Shop'
import { useGameStore } from '../../store/gameStore'

describe('Shop', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  it('renders shop items', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('Syntax Highlighter+')).toBeInTheDocument()
    expect(screen.getByText('Bug Detector')).toBeInTheDocument()
  })

  it('shows player money', () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('$200')).toBeInTheDocument()
  })

  it('disables buy button when not enough money', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    const buyButtons = screen.getAllByRole('button', { name: /buy/i })
    buyButtons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('allows buying when enough money', async () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    // Syntax Highlighter+ costs $50
    const buyButtons = screen.getAllByRole('button', { name: /buy/i })
    await userEvent.click(buyButtons[0])
    expect(useGameStore.getState().ownedTools).toContain('syntax-highlighter')
    expect(useGameStore.getState().money).toBe(150)
  })

  it('shows "Owned" for purchased tools', () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    useGameStore.getState().buyTool('syntax-highlighter', 50)
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('Owned')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/screens/__tests__/Shop.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Shop**

Create `src/screens/Shop.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { SHOP_ITEMS } from '../types'

export function Shop() {
  const { money, ownedTools, buyTool } = useGameStore()

  return (
    <div className="shop-screen">
      <header className="shop-header">
        <h1>Tool Shop</h1>
        <div className="shop-actions">
          <span className="money">${money}</span>
          <Link to="/board" className="back-link">Back to Board</Link>
        </div>
      </header>
      <div className="shop-grid">
        {SHOP_ITEMS.map((item) => {
          const owned = !item.consumable && ownedTools.includes(item.id)
          const canAfford = money >= item.price

          return (
            <div key={item.id} className={`shop-card ${owned ? 'owned' : ''}`}>
              <h3>{item.name}</h3>
              <p className="item-description">{item.description}</p>
              <p className="item-price">${item.price}{item.consumable ? ' each' : ''}</p>
              {owned ? (
                <span className="owned-label">Owned</span>
              ) : (
                <button
                  className="buy-btn"
                  disabled={!canAfford}
                  onClick={() => buyTool(item.id, item.price)}
                >
                  Buy
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add Shop route to App.tsx**

Update `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './screens/MainMenu'
import { ClientBoard } from './screens/ClientBoard'
import { Mission } from './screens/Mission'
import { Shop } from './screens/Shop'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/board" element={<ClientBoard />} />
        <Route path="/mission/:levelId" element={<Mission />} />
        <Route path="/shop" element={<Shop />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Shop.tsx src/screens/__tests__/Shop.test.tsx src/App.tsx
git commit -m "feat: add Shop screen with tool purchasing"
```

---

## Task 13: Global Styles

**Files:**
- Create: `src/index.css`

This task does not use TDD — it is purely visual CSS.

- [ ] **Step 1: Write global styles**

Replace `src/index.css`:

```css
/* Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-dark: #1a1a2e;
  --bg-panel: #16213e;
  --bg-card: #0f3460;
  --bg-surface: #1a1a3e;
  --accent: #e94560;
  --accent-hover: #ff6b81;
  --text-primary: #eee;
  --text-secondary: #aaa;
  --text-muted: #666;
  --success: #2ecc71;
  --fail: #e74c3c;
  --warning: #f39c12;
  --border: #333;
  --font-mono: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  --font-sans: 'Inter', -apple-system, sans-serif;
}

body {
  font-family: var(--font-sans);
  background: var(--bg-dark);
  color: var(--text-primary);
  min-height: 100vh;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  color: var(--accent-hover);
}

/* Main Menu */
.main-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
}

.main-menu h1 {
  font-size: 4rem;
  font-family: var(--font-mono);
  color: var(--accent);
}

.main-menu .subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 24px;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-btn {
  display: block;
  padding: 12px 48px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1.1rem;
  text-align: center;
  transition: background 0.2s;
}

.menu-btn:hover {
  background: var(--accent);
  color: white;
}

.menu-btn.disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Client Board */
.client-board {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.board-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.money {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  color: var(--success);
  font-weight: bold;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.level-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.level-card.locked {
  opacity: 0.5;
}

.level-card.completed {
  border-color: var(--success);
}

.level-card .client-name {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.level-card .brief {
  color: var(--text-secondary);
  font-size: 0.85rem;
  flex: 1;
}

.level-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.difficulty {
  color: var(--warning);
}

.payout {
  color: var(--success);
  font-family: var(--font-mono);
}

.start-btn {
  display: block;
  text-align: center;
  padding: 8px;
  background: var(--accent);
  border-radius: 6px;
  color: white;
  font-weight: 600;
  margin-top: 8px;
}

.start-btn:hover {
  background: var(--accent-hover);
  color: white;
}

.locked-label {
  text-align: center;
  color: var(--text-muted);
  padding: 8px;
  margin-top: 8px;
}

/* Mission Screen */
.mission-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.mission-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.client-brief {
  flex: 1;
}

.client-brief .client-name {
  color: var(--accent);
}

.client-brief .brief-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.client-brief .hint-text {
  color: var(--warning);
  font-size: 0.85rem;
  margin-top: 4px;
}

.mission-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.timer {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.submit-btn {
  padding: 8px 24px;
  background: var(--success);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mission-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.mission-left {
  width: 50%;
  border-right: 1px solid var(--border);
}

.code-editor {
  height: 100%;
}

.mission-right {
  width: 50%;
  display: flex;
  flex-direction: column;
}

.live-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border);
}

.live-preview h3 {
  padding: 8px 12px;
  background: var(--bg-panel);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.preview-iframe {
  flex: 1;
  border: none;
  background: white;
  width: 100%;
}

.test-panel {
  padding: 12px;
  background: var(--bg-surface);
  max-height: 250px;
  overflow-y: auto;
}

.test-panel h3 {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.test-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.test-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.test-item.passed {
  color: var(--success);
}

.test-item.failed {
  color: var(--fail);
}

.test-item.pending {
  color: var(--text-muted);
}

.test-status {
  font-family: var(--font-mono);
  font-weight: bold;
  width: 16px;
}

.test-hints {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  max-width: 440px;
  width: 90%;
  text-align: center;
}

.modal h2 {
  color: var(--success);
  margin-bottom: 16px;
}

.modal .client-message {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.modal-stats {
  margin-bottom: 24px;
}

.modal-stats .payout {
  font-size: 1.5rem;
  color: var(--success);
  font-family: var(--font-mono);
  font-weight: bold;
}

.modal-stats .already-completed {
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
}

.modal-btn:hover {
  background: var(--accent);
  color: white;
}

/* Shop */
.shop-screen {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.shop-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.shop-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-card.owned {
  border-color: var(--success);
  opacity: 0.7;
}

.item-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  flex: 1;
}

.item-price {
  color: var(--success);
  font-family: var(--font-mono);
  font-weight: bold;
}

.buy-btn {
  padding: 8px;
  background: var(--accent);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

.buy-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.buy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.owned-label {
  text-align: center;
  color: var(--success);
  padding: 8px;
  margin-top: 8px;
  font-weight: 600;
}

/* Bug Detector gutter icon */
.bug-gutter-icon {
  background: var(--warning);
  border-radius: 50%;
  width: 8px !important;
  height: 8px !important;
  margin-left: 4px;
  margin-top: 6px;
}
```

- [ ] **Step 2: Verify import in main.tsx**

Ensure `src/main.tsx` imports `./index.css`. The Vite scaffold should already have this. If not, add `import './index.css'` at the top of `src/main.tsx`.

- [ ] **Step 3: Run `npm run dev` and visually verify**

Open the browser and check:
- Main menu renders centered with dark theme
- Navigate to /board — level cards show
- Click through to a mission — editor + preview + tests visible

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/main.tsx
git commit -m "feat: add global styles with dark theme"
```

---

## Task 14: Remaining Levels (4-8)

**Files:**
- Create: `src/data/levels/level-04.ts` through `src/data/levels/level-08.ts`
- Modify: `src/data/levels/index.ts`

- [ ] **Step 1: Create Level 4 — "TechBlog" (difficulty 3, typography + spacing)**

Create `src/data/levels/level-04.ts`:

```typescript
import type { Level } from '../../types'

const level: Level = {
  id: 'level-04',
  title: "Fix the Blog Typography",
  client: {
    name: "TechBlog Daily",
    avatar: '',
    brief: "Our blog posts look terrible. The headings are too small, paragraphs have no spacing, and the code blocks don't stand out at all.",
    completionMessage: "Readers can finally enjoy our articles. Great work!",
    hintMessage: "Focus on font-size for headings, margin for paragraphs, and background for code blocks.",
  },
  difficulty: 3,
  payout: 200,
  prerequisites: ['level-02'],
  html: `<article class="post">
  <h1 class="post-title">Understanding CSS Specificity</h1>
  <p class="post-meta">Posted on March 15, 2026</p>
  <p class="post-body">CSS specificity determines which styles are applied when multiple rules target the same element.</p>
  <pre class="code-block">
.parent .child { color: blue; }
.child { color: red; }
  </pre>
  <p class="post-body">In this case, the first rule wins because it has higher specificity.</p>
</article>`,
  buggyCSS: `.post {
  max-width: 680px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: Georgia, serif;
  line-height: 1.6;
}

.post-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.post-meta {
  color: rgb(153, 153, 153);
  font-size: 14px;
  margin-bottom: 24px;
}

.post-body {
  margin-bottom: 0px;
  font-size: 16px;
  color: rgb(51, 51, 51);
}

.code-block {
  background-color: rgb(255, 255, 255);
  padding: 0px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  overflow-x: auto;
  margin-bottom: 16px;
}`,
  solutionCSS: `.post {
  max-width: 680px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: Georgia, serif;
  line-height: 1.6;
}

.post-title {
  font-size: 32px;
  margin-bottom: 8px;
}

.post-meta {
  color: rgb(153, 153, 153);
  font-size: 14px;
  margin-bottom: 24px;
}

.post-body {
  margin-bottom: 16px;
  font-size: 16px;
  color: rgb(51, 51, 51);
}

.code-block {
  background-color: rgb(245, 245, 245);
  padding: 16px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  overflow-x: auto;
  margin-bottom: 16px;
}`,
  bugLines: [10, 11, 22, 28, 29],
  tests: [
    {
      id: 'test-title-size',
      description: 'Post title should be large (32px)',
      assertions: [
        { selector: '.post-title', property: 'font-size', expected: '32px' },
      ],
    },
    {
      id: 'test-body-spacing',
      description: 'Paragraphs should have bottom margin (16px)',
      assertions: [
        { selector: '.post-body', property: 'margin-bottom', expected: '16px' },
      ],
    },
    {
      id: 'test-code-block',
      description: 'Code block should have a gray background and padding',
      assertions: [
        { selector: '.code-block', property: 'background-color', expected: 'rgb(245, 245, 245)' },
        { selector: '.code-block', property: 'padding-top', expected: '16px' },
      ],
    },
  ],
}

export default level
```

- [ ] **Step 2: Create Level 5 — "EventPage" (difficulty 4, flexbox alignment + overflow)**

Create `src/data/levels/level-05.ts`:

```typescript
import type { Level } from '../../types'

const level: Level = {
  id: 'level-05',
  title: "Fix the Event Page",
  client: {
    name: "EventBright",
    avatar: '',
    brief: "Our event page is a disaster! The banner image overflows, the ticket info isn't aligned properly, and the CTA button is invisible against the background.",
    completionMessage: "The event page looks fantastic! Ticket sales are going to skyrocket.",
    hintMessage: "Check the banner's overflow and object-fit, the ticket section's alignment, and the button colors.",
  },
  difficulty: 4,
  payout: 300,
  prerequisites: ['level-03'],
  html: `<div class="event-page">
  <div class="banner">
    <img class="banner-img" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='400'><rect fill='%234a90d9' width='800' height='400'/><text x='400' y='200' text-anchor='middle' fill='white' font-size='32'>Summer Music Festival</text></svg>" alt="Event Banner" />
  </div>
  <div class="ticket-section">
    <div class="ticket-info">
      <h2>General Admission</h2>
      <p class="price">$49.99</p>
    </div>
    <button class="cta-btn">Buy Tickets</button>
  </div>
  <div class="details">
    <div class="detail-item">
      <strong>Date</strong>
      <span>July 15, 2026</span>
    </div>
    <div class="detail-item">
      <strong>Location</strong>
      <span>Central Park</span>
    </div>
    <div class="detail-item">
      <strong>Time</strong>
      <span>2:00 PM - 11:00 PM</span>
    </div>
  </div>
</div>`,
  buggyCSS: `.event-page {
  max-width: 700px;
  margin: 0 auto;
}

.banner {
  height: 250px;
  overflow: visible;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ticket-section {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 24px;
  background-color: rgb(245, 245, 245);
}

.ticket-info h2 {
  margin: 0;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: rgb(51, 51, 51);
}

.cta-btn {
  padding: 12px 32px;
  background-color: rgb(245, 245, 245);
  color: rgb(245, 245, 245);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.details {
  display: flex;
  justify-content: space-around;
  padding: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}`,
  solutionCSS: `.event-page {
  max-width: 700px;
  margin: 0 auto;
}

.banner {
  height: 250px;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ticket-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background-color: rgb(245, 245, 245);
}

.ticket-info h2 {
  margin: 0;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: rgb(51, 51, 51);
}

.cta-btn {
  padding: 12px 32px;
  background-color: rgb(74, 144, 217);
  color: rgb(255, 255, 255);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.details {
  display: flex;
  justify-content: space-around;
  padding: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}`,
  bugLines: [8, 14, 20, 21, 37, 38],
  tests: [
    {
      id: 'test-banner-overflow',
      description: 'Banner should clip overflow and cover the area',
      assertions: [
        { selector: '.banner', property: 'overflow', expected: 'hidden' },
        { selector: '.banner-img', property: 'object-fit', expected: 'cover' },
      ],
    },
    {
      id: 'test-ticket-alignment',
      description: 'Ticket section should space items apart and center vertically',
      assertions: [
        { selector: '.ticket-section', property: 'justify-content', expected: 'space-between' },
        { selector: '.ticket-section', property: 'align-items', expected: 'center' },
      ],
    },
    {
      id: 'test-cta-visible',
      description: 'CTA button should have a blue background with white text',
      assertions: [
        { selector: '.cta-btn', property: 'background-color', expected: 'rgb(74, 144, 217)' },
        { selector: '.cta-btn', property: 'color', expected: 'rgb(255, 255, 255)' },
      ],
    },
  ],
}

export default level
```

- [ ] **Step 3: Create Level 6 — "Dashboard" (difficulty 4, grid + z-index)**

Create `src/data/levels/level-06.ts`:

```typescript
import type { Level } from '../../types'

const level: Level = {
  id: 'level-06',
  title: "Fix the Dashboard Layout",
  client: {
    name: "DataDash Corp",
    avatar: '',
    brief: "Our analytics dashboard is broken. The sidebar should be on the left, the cards should be in a 2-column grid, and the notification badge is hidden behind other elements.",
    completionMessage: "The dashboard is working perfectly now. Our team can finally track metrics!",
    hintMessage: "The main layout needs grid, the cards need grid columns, and the badge needs a higher z-index.",
  },
  difficulty: 4,
  payout: 300,
  prerequisites: ['level-03'],
  html: `<div class="dashboard">
  <aside class="sidebar">
    <h2>DataDash</h2>
    <nav>
      <a href="#" class="nav-item active">Overview</a>
      <a href="#" class="nav-item">Analytics</a>
      <a href="#" class="nav-item">Reports</a>
    </nav>
  </aside>
  <main class="content">
    <div class="top-bar">
      <h1>Overview</h1>
      <div class="notification-wrapper">
        <span class="bell">Bell</span>
        <span class="badge">3</span>
      </div>
    </div>
    <div class="card-grid">
      <div class="stat-card">
        <h3>Users</h3>
        <p class="stat-value">12,345</p>
      </div>
      <div class="stat-card">
        <h3>Revenue</h3>
        <p class="stat-value">$84,230</p>
      </div>
      <div class="stat-card">
        <h3>Orders</h3>
        <p class="stat-value">1,847</p>
      </div>
      <div class="stat-card">
        <h3>Growth</h3>
        <p class="stat-value">+23%</p>
      </div>
    </div>
  </main>
</div>`,
  buggyCSS: `.dashboard {
  display: block;
  min-height: 100vh;
}

.sidebar {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  padding: 20px;
  width: 220px;
}

.sidebar h2 {
  margin-bottom: 24px;
}

.nav-item {
  display: block;
  color: rgb(170, 170, 170);
  padding: 8px 12px;
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 4px;
}

.nav-item.active {
  background-color: rgb(74, 144, 217);
  color: rgb(255, 255, 255);
}

.content {
  padding: 24px;
  flex: 1;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.notification-wrapper {
  position: relative;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: rgb(231, 76, 60);
  color: rgb(255, 255, 255);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 0;
}

.card-grid {
  display: block;
  gap: 16px;
}

.stat-card {
  background-color: rgb(245, 245, 245);
  border-radius: 12px;
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
}`,
  solutionCSS: `.dashboard {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.sidebar {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  padding: 20px;
  width: 220px;
}

.sidebar h2 {
  margin-bottom: 24px;
}

.nav-item {
  display: block;
  color: rgb(170, 170, 170);
  padding: 8px 12px;
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 4px;
}

.nav-item.active {
  background-color: rgb(74, 144, 217);
  color: rgb(255, 255, 255);
}

.content {
  padding: 24px;
  flex: 1;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.notification-wrapper {
  position: relative;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: rgb(231, 76, 60);
  color: rgb(255, 255, 255);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 10;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: rgb(245, 245, 245);
  border-radius: 12px;
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
}`,
  bugLines: [2, 55, 58, 59],
  tests: [
    {
      id: 'test-dashboard-layout',
      description: 'Dashboard should use grid with sidebar and content columns',
      assertions: [
        { selector: '.dashboard', property: 'display', expected: 'grid' },
        { selector: '.dashboard', property: 'grid-template-columns', expected: '220px 1fr' },
      ],
    },
    {
      id: 'test-badge-visible',
      description: 'Notification badge should appear above other elements (z-index)',
      assertions: [
        { selector: '.badge', property: 'z-index', expected: '10' },
      ],
    },
    {
      id: 'test-card-grid',
      description: 'Stat cards should be in a 2-column grid',
      assertions: [
        { selector: '.card-grid', property: 'display', expected: 'grid' },
        { selector: '.card-grid', property: 'grid-template-columns', expected: 'repeat(2, 1fr)' },
      ],
    },
  ],
}

export default level
```

- [ ] **Step 4: Create Level 7 — "Restaurant" (difficulty 5, responsive + transform)**

Create `src/data/levels/level-07.ts`:

```typescript
import type { Level } from '../../types'

const level: Level = {
  id: 'level-07',
  title: "Fix the Restaurant Menu",
  client: {
    name: "La Maison Fine Dining",
    avatar: '',
    brief: "Our restaurant page is embarrassing. The hero section text isn't centered over the image, the menu categories should scroll horizontally, and the reservation button doesn't look clickable at all.",
    completionMessage: "Magnifique! Our online presence finally matches our cuisine.",
    hintMessage: "The hero needs absolute positioning with transforms for centering. The categories need overflow-x. The button needs proper styling.",
  },
  difficulty: 5,
  payout: 400,
  prerequisites: ['level-05', 'level-06'],
  html: `<section class="hero">
  <div class="hero-overlay">
    <h1 class="hero-title">La Maison</h1>
    <p class="hero-subtitle">Fine Dining Since 1987</p>
  </div>
</section>
<div class="categories-scroll">
  <span class="category active">Appetizers</span>
  <span class="category">Mains</span>
  <span class="category">Desserts</span>
  <span class="category">Wine</span>
  <span class="category">Cocktails</span>
  <span class="category">Specials</span>
</div>
<div class="menu-section">
  <div class="menu-item">
    <span class="dish-name">Truffle Risotto</span>
    <span class="dish-price">$28</span>
  </div>
  <div class="menu-item">
    <span class="dish-name">Wagyu Steak</span>
    <span class="dish-price">$65</span>
  </div>
</div>
<div class="reservation">
  <button class="reserve-btn">Make a Reservation</button>
</div>`,
  buggyCSS: `.hero {
  position: relative;
  height: 300px;
  background-color: rgb(30, 30, 30);
}

.hero-overlay {
  position: static;
  top: auto;
  left: auto;
  transform: none;
  text-align: center;
  color: rgb(255, 255, 255);
}

.hero-title {
  font-size: 48px;
  font-family: Georgia, serif;
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 18px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.categories-scroll {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: hidden;
  white-space: nowrap;
  background-color: rgb(245, 245, 245);
}

.category {
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.category.active {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
}

.menu-section {
  max-width: 600px;
  margin: 24px auto;
  padding: 0 20px;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgb(221, 221, 221);
}

.dish-price {
  font-weight: bold;
}

.reservation {
  text-align: center;
  padding: 32px;
}

.reserve-btn {
  padding: 14px 40px;
  background-color: transparent;
  color: rgb(200, 200, 200);
  border: none;
  border-radius: 0px;
  font-size: 16px;
  cursor: pointer;
}`,
  solutionCSS: `.hero {
  position: relative;
  height: 300px;
  background-color: rgb(30, 30, 30);
}

.hero-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgb(255, 255, 255);
}

.hero-title {
  font-size: 48px;
  font-family: Georgia, serif;
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 18px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.categories-scroll {
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow-x: auto;
  white-space: nowrap;
  background-color: rgb(245, 245, 245);
}

.category {
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.category.active {
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
}

.menu-section {
  max-width: 600px;
  margin: 24px auto;
  padding: 0 20px;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgb(221, 221, 221);
}

.dish-price {
  font-weight: bold;
}

.reservation {
  text-align: center;
  padding: 32px;
}

.reserve-btn {
  padding: 14px 40px;
  background-color: rgb(30, 30, 30);
  color: rgb(255, 255, 255);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}`,
  bugLines: [8, 9, 10, 11, 32, 69, 70, 72],
  tests: [
    {
      id: 'test-hero-centering',
      description: 'Hero text should be absolutely positioned for centering',
      assertions: [
        { selector: '.hero-overlay', property: 'position', expected: 'absolute' },
      ],
    },
    {
      id: 'test-categories-scroll',
      description: 'Categories should scroll horizontally when overflowing',
      assertions: [
        { selector: '.categories-scroll', property: 'overflow-x', expected: 'auto' },
      ],
    },
    {
      id: 'test-reserve-btn',
      description: 'Reservation button should look clickable with dark background and rounded corners',
      assertions: [
        { selector: '.reserve-btn', property: 'background-color', expected: 'rgb(30, 30, 30)' },
        { selector: '.reserve-btn', property: 'color', expected: 'rgb(255, 255, 255)' },
        { selector: '.reserve-btn', property: 'border-top-left-radius', expected: '8px' },
      ],
    },
  ],
}

export default level
```

- [ ] **Step 5: Create Level 8 — "E-commerce" (difficulty 5, complex multi-bug)**

Create `src/data/levels/level-08.ts`:

```typescript
import type { Level } from '../../types'

const level: Level = {
  id: 'level-08',
  title: "Fix the Product Page",
  client: {
    name: "ShopNow",
    avatar: '',
    brief: "Our product page is losing us sales! The image gallery doesn't work, the price is invisible, the 'Add to Cart' button blends into the background, the reviews section is a mess, and the rating stars aren't inline.",
    completionMessage: "Sales are already picking up! You're a CSS wizard.",
    hintMessage: "There are 5 separate issues: gallery flex direction, price color, button styling, review layout, and star display.",
  },
  difficulty: 5,
  payout: 400,
  prerequisites: ['level-05', 'level-06'],
  html: `<div class="product-page">
  <div class="gallery">
    <img class="main-image" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect fill='%23ddd' width='400' height='400'/><text x='200' y='200' text-anchor='middle' fill='%23999' font-size='20'>Product Image</text></svg>" alt="Product" />
    <div class="thumbnails">
      <div class="thumb">1</div>
      <div class="thumb">2</div>
      <div class="thumb">3</div>
    </div>
  </div>
  <div class="product-info">
    <h1 class="product-name">Premium Wireless Headphones</h1>
    <div class="rating">
      <span class="stars">★★★★☆</span>
      <span class="review-count">(128 reviews)</span>
    </div>
    <p class="price">$199.99</p>
    <p class="description">High-quality noise-cancelling headphones with 30-hour battery life.</p>
    <button class="add-to-cart">Add to Cart</button>
  </div>
</div>
<div class="reviews-section">
  <h2>Customer Reviews</h2>
  <div class="review">
    <div class="review-header">
      <strong>Jane D.</strong>
      <span class="review-stars">★★★★★</span>
    </div>
    <p class="review-text">Best headphones I've ever owned!</p>
  </div>
  <div class="review">
    <div class="review-header">
      <strong>Mike R.</strong>
      <span class="review-stars">★★★★☆</span>
    </div>
    <p class="review-text">Great sound quality, slightly tight fit.</p>
  </div>
</div>`,
  buggyCSS: `.product-page {
  display: flex;
  max-width: 900px;
  margin: 24px auto;
  padding: 20px;
  gap: 32px;
}

.gallery {
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 400px;
}

.main-image {
  width: 100%;
  border-radius: 8px;
}

.thumbnails {
  display: flex;
  gap: 8px;
}

.thumb {
  width: 60px;
  height: 60px;
  background-color: rgb(221, 221, 221);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 24px;
  margin-bottom: 8px;
}

.rating {
  display: block;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stars {
  color: rgb(255, 193, 7);
  font-size: 18px;
}

.price {
  font-size: 28px;
  font-weight: bold;
  color: rgb(255, 255, 255);
  margin-bottom: 12px;
}

.description {
  color: rgb(102, 102, 102);
  margin-bottom: 20px;
  line-height: 1.5;
}

.add-to-cart {
  padding: 14px 32px;
  background-color: rgb(240, 240, 240);
  color: rgb(240, 240, 240);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

.reviews-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.reviews-section h2 {
  margin-bottom: 16px;
}

.review {
  padding: 16px 0;
  border-bottom: 1px solid rgb(221, 221, 221);
}

.review-header {
  display: block;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.review-stars {
  color: rgb(255, 193, 7);
}

.review-text {
  color: rgb(102, 102, 102);
}`,
  solutionCSS: `.product-page {
  display: flex;
  max-width: 900px;
  margin: 24px auto;
  padding: 20px;
  gap: 32px;
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 400px;
}

.main-image {
  width: 100%;
  border-radius: 8px;
}

.thumbnails {
  display: flex;
  gap: 8px;
}

.thumb {
  width: 60px;
  height: 60px;
  background-color: rgb(221, 221, 221);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 24px;
  margin-bottom: 8px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stars {
  color: rgb(255, 193, 7);
  font-size: 18px;
}

.price {
  font-size: 28px;
  font-weight: bold;
  color: rgb(51, 51, 51);
  margin-bottom: 12px;
}

.description {
  color: rgb(102, 102, 102);
  margin-bottom: 20px;
  line-height: 1.5;
}

.add-to-cart {
  padding: 14px 32px;
  background-color: rgb(74, 144, 217);
  color: rgb(255, 255, 255);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}

.reviews-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.reviews-section h2 {
  margin-bottom: 16px;
}

.review {
  padding: 16px 0;
  border-bottom: 1px solid rgb(221, 221, 221);
}

.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.review-stars {
  color: rgb(255, 193, 7);
}

.review-text {
  color: rgb(102, 102, 102);
}`,
  bugLines: [11, 42, 54, 63, 64, 85],
  tests: [
    {
      id: 'test-gallery-column',
      description: 'Gallery should stack image and thumbnails vertically',
      assertions: [
        { selector: '.gallery', property: 'flex-direction', expected: 'column' },
      ],
    },
    {
      id: 'test-rating-inline',
      description: 'Rating stars and review count should be inline (flex)',
      assertions: [
        { selector: '.rating', property: 'display', expected: 'flex' },
      ],
    },
    {
      id: 'test-price-visible',
      description: 'Price should be visible (dark text)',
      assertions: [
        { selector: '.price', property: 'color', expected: 'rgb(51, 51, 51)' },
      ],
    },
    {
      id: 'test-cart-button',
      description: 'Add to Cart button should be blue with white text',
      assertions: [
        { selector: '.add-to-cart', property: 'background-color', expected: 'rgb(74, 144, 217)' },
        { selector: '.add-to-cart', property: 'color', expected: 'rgb(255, 255, 255)' },
      ],
    },
    {
      id: 'test-review-header',
      description: 'Review header should display name and stars inline',
      assertions: [
        { selector: '.review-header', property: 'display', expected: 'flex' },
      ],
    },
  ],
}

export default level
```

- [ ] **Step 6: Update level registry**

Update `src/data/levels/index.ts`:

```typescript
import type { Level } from '../../types'
import level01 from './level-01'
import level02 from './level-02'
import level03 from './level-03'
import level04 from './level-04'
import level05 from './level-05'
import level06 from './level-06'
import level07 from './level-07'
import level08 from './level-08'

export const levels: Level[] = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
  level07,
  level08,
]

export function getLevelById(id: string): Level | undefined {
  return levels.find((l) => l.id === id)
}
```

- [ ] **Step 7: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/data/levels/
git commit -m "feat: add levels 4-8 with increasing difficulty"
```

---

## Task 15: Integration Smoke Test

**Files:**
- No new files

- [ ] **Step 1: Run all unit tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run type checking**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Run dev server and manually test the full flow**

Run: `npm run dev`

Manually verify:
1. Main menu loads with "Debugger" title
2. Click "New Game" → Client Board shows all levels, only level-01 unlocked
3. Click "Accept Contract" on level-01 → Mission screen loads with Monaco editor, preview, and tests
4. Edit the CSS to fix the bugs → tests go green in real time
5. Click "Submit" → Level Complete modal shows with payout
6. Click "Back to Board" → level-01 marked as completed, level-02 now unlocked
7. Navigate to Shop → items display with correct prices
8. Buy a tool → money deducted, tool marked as owned
9. Refresh the page → progress is preserved (localStorage)

- [ ] **Step 4: Fix any integration issues discovered**

Address any issues found during manual testing.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix: address integration issues from smoke testing"
```

(Skip this commit if no issues were found.)

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Project scaffolding | — |
| 2 | Type definitions | Compile check |
| 3 | Game store | 8 unit tests |
| 4 | Level store | 7 unit tests |
| 5 | CSS injector | 4 unit tests |
| 6 | Test runner | 6 unit tests |
| 7 | Level data (1-3) | Compile check |
| 8 | Main menu + router | 2 component tests |
| 9 | Client board | 5 component tests |
| 10 | Core components | 4 component tests |
| 11 | Mission screen + modal | 3 component tests |
| 12 | Shop screen | 5 component tests |
| 13 | Global styles | Visual verification |
| 14 | Levels 4-8 | Compile check |
| 15 | Integration smoke test | Manual verification |

**Total: 15 tasks, ~44 automated tests, 8 levels**

# Skip Level Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a skip-level mechanic that lets players pay 2x a level's payout to skip it and unlock dependent levels, with the ability to solve it later for the full payout.

**Architecture:** gameStore gets a `skippedLevels` array and `skipLevel` action. `completeLevel` is modified to handle solving previously-skipped levels. ClientBoard shows a skip button with confirmation dialog. Skipped levels display with an orange border.

**Tech Stack:** React 19, TypeScript, Vitest, Zustand, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-24-steam-review-improvements-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/store/gameStore.ts` | Modify | Add `skippedLevels`, `skipLevel` action, update `completeLevel`, migration |
| `src/screens/ClientBoard.tsx` | Modify | Skip button, confirmation dialog, orange border |
| `src/screens/Mission.tsx` | Modify | Fix `wasAlreadyCompleted` to exclude skipped levels |
| `src/store/__tests__/gameStore.test.ts` | Modify | Tests for skip mechanics |
| `src/screens/__tests__/ClientBoard.test.tsx` | Modify | Tests for skip UI |

---

### Task 1: Add skip level logic to gameStore

**Files:**
- Modify: `src/store/gameStore.ts`
- Modify: `src/store/__tests__/gameStore.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/store/__tests__/gameStore.test.ts`:

```typescript
  describe('skipLevel', () => {
    it('deducts cost and marks level as completed and skipped', () => {
      const { skipLevel } = useGameStore.getState()
      useGameStore.setState({ money: 500 })
      skipLevel('level-01', 200)
      const state = useGameStore.getState()
      expect(state.money).toBe(300)
      expect(state.completedLevels).toContain('level-01')
      expect(state.skippedLevels).toContain('level-01')
    })

    it('does not skip when insufficient funds', () => {
      const { skipLevel } = useGameStore.getState()
      useGameStore.setState({ money: 50 })
      skipLevel('level-01', 200)
      const state = useGameStore.getState()
      expect(state.money).toBe(50)
      expect(state.completedLevels).not.toContain('level-01')
      expect(state.skippedLevels).not.toContain('level-01')
    })

    it('does not skip already completed level', () => {
      useGameStore.setState({ money: 500, completedLevels: ['level-01'] })
      const { skipLevel } = useGameStore.getState()
      skipLevel('level-01', 200)
      const state = useGameStore.getState()
      expect(state.money).toBe(500)
      expect(state.skippedLevels).not.toContain('level-01')
    })
  })

  describe('completeLevel with skipped levels', () => {
    it('awards payout when solving a previously skipped level', () => {
      useGameStore.setState({
        money: 100,
        completedLevels: ['level-01'],
        skippedLevels: ['level-01'],
      })
      const { completeLevel } = useGameStore.getState()
      completeLevel('level-01', 100, 45)
      const state = useGameStore.getState()
      expect(state.money).toBe(200)
      expect(state.skippedLevels).not.toContain('level-01')
      expect(state.completedLevels).toContain('level-01')
      expect(state.bestTimes['level-01']).toBe(45)
    })

    it('updates best time when solving skipped level', () => {
      useGameStore.setState({
        money: 0,
        completedLevels: ['level-01'],
        skippedLevels: ['level-01'],
        bestTimes: {},
      })
      const { completeLevel } = useGameStore.getState()
      completeLevel('level-01', 100, 30)
      expect(useGameStore.getState().bestTimes['level-01']).toBe(30)
    })
  })

  describe('resetGame with skippedLevels', () => {
    it('clears skippedLevels on reset', () => {
      useGameStore.setState({ skippedLevels: ['level-01', 'level-02'] })
      useGameStore.getState().resetGame()
      expect(useGameStore.getState().skippedLevels).toEqual([])
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/store/__tests__/gameStore.test.ts`
Expected: New tests fail (skippedLevels and skipLevel don't exist)

- [ ] **Step 3: Implement the skip level logic**

Update `src/store/gameStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GameState {
  money: number
  completedLevels: string[]
  skippedLevels: string[]
  ownedTools: string[]
  inProgressCSS: Record<string, string>
  bestTimes: Record<string, number>
}

interface GameActions {
  completeLevel: (levelId: string, payout: number, time: number) => void
  buyTool: (toolId: string, price: number) => void
  saveProgress: (levelId: string, css: string) => void
  skipLevel: (levelId: string, cost: number) => void
  resetGame: () => void
}

const initialState: GameState = {
  money: 0,
  completedLevels: [],
  skippedLevels: [],
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
        const wasSkipped = state.skippedLevels.includes(levelId)
        const alreadyCompleted = state.completedLevels.includes(levelId)

        if (wasSkipped) {
          // Solving a previously skipped level: award payout, remove from skipped
          set({
            money: state.money + payout,
            skippedLevels: state.skippedLevels.filter((id) => id !== levelId),
            bestTimes: {
              ...state.bestTimes,
              [levelId]:
                state.bestTimes[levelId] !== undefined
                  ? Math.min(state.bestTimes[levelId], time)
                  : time,
            },
          })
          return
        }

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
        if (state.ownedTools.includes(toolId)) return
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

      skipLevel: (levelId, cost) => {
        const state = get()
        if (state.money < cost) return
        if (state.completedLevels.includes(levelId)) return
        set({
          money: state.money - cost,
          completedLevels: [...state.completedLevels, levelId],
          skippedLevels: [...state.skippedLevels, levelId],
        })
      },

      resetGame: () => set(initialState),
    }),
    {
      name: 'debugger-game-save',
      version: 1,
      migrate: (persisted: any, version: number) => {
        if (version === 0 || !persisted.skippedLevels) {
          persisted.skippedLevels = []
        }
        return persisted
      },
    }
  )
)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/store/__tests__/gameStore.test.ts`
Expected: All tests PASS (new + existing)

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts src/store/__tests__/gameStore.test.ts
git commit -m "feat: add skipLevel action and skippedLevels state to gameStore"
```

---

### Task 2: Add skip UI to ClientBoard

**Files:**
- Modify: `src/screens/ClientBoard.tsx`
- Modify: `src/screens/__tests__/ClientBoard.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/screens/__tests__/ClientBoard.test.tsx`:

```typescript
  it('shows skip button for unlocked, incomplete levels when player can afford', () => {
    useGameStore.setState({ money: 500 })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    // Level 1 is unlocked and not completed
    const skipButtons = screen.getAllByText(/Skip/)
    expect(skipButtons.length).toBeGreaterThan(0)
  })

  it('does not show skip button for completed levels', () => {
    useGameStore.setState({ money: 500, completedLevels: ['level-01'] })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const level1Card = screen.getAllByTestId('level-card')[0]
    expect(level1Card.querySelector('[data-testid="skip-button"]')).not.toBeInTheDocument()
  })

  it('does not show skip button when player cannot afford', () => {
    useGameStore.setState({ money: 0 })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('skip-button')).not.toBeInTheDocument()
  })

  it('shows orange border for skipped levels', () => {
    useGameStore.setState({
      completedLevels: ['level-01'],
      skippedLevels: ['level-01'],
    })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    const cards = screen.getAllByTestId('level-card')
    expect(cards[0].className).toContain('border-orange-500')
  })

  it('shows Replay button for skipped levels (they are completedLevels too)', () => {
    useGameStore.setState({
      completedLevels: ['level-01'],
      skippedLevels: ['level-01'],
    })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    expect(screen.getByText('Replay')).toBeInTheDocument()
  })

  it('opens confirmation dialog and skips level on confirm', () => {
    useGameStore.setState({ money: 500 })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    fireEvent.click(screen.getAllByTestId('skip-button')[0])
    expect(screen.getByText('Skip Level?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Skip'))
    const state = useGameStore.getState()
    expect(state.skippedLevels).toContain('level-01')
    expect(state.money).toBe(300) // 500 - 200 (2x $100 payout)
  })

  it('closes confirmation dialog on cancel without skipping', () => {
    useGameStore.setState({ money: 500 })
    render(
      <MemoryRouter>
        <ClientBoard />
      </MemoryRouter>
    )
    fireEvent.click(screen.getAllByTestId('skip-button')[0])
    fireEvent.click(screen.getByText('Cancel'))
    expect(useGameStore.getState().skippedLevels).not.toContain('level-01')
    expect(useGameStore.getState().money).toBe(500)
  })
```

Add `fireEvent` to the existing testing-library import if not already present.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/screens/__tests__/ClientBoard.test.tsx`
Expected: New tests fail

- [ ] **Step 3: Implement the skip UI**

Update `src/screens/ClientBoard.tsx`:

```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { levels } from '../data/levels'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function ClientBoard() {
  const { money, completedLevels, skippedLevels, skipLevel } = useGameStore()
  const [skipConfirm, setSkipConfirm] = useState<{ levelId: string; cost: number; payout: number } | null>(null)

  const isLevelUnlocked = (prerequisites: string[]) =>
    prerequisites.every((id) => completedLevels.includes(id))

  const handleSkipConfirm = () => {
    if (!skipConfirm) return
    skipLevel(skipConfirm.levelId, skipConfirm.cost)
    setSkipConfirm(null)
  }

  return (
    <div className="mx-auto max-w-[900px] p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Board</h1>
        <div className="flex items-center gap-4">
          <span data-testid="money" className="font-mono text-lg font-bold text-green-500">
            ${money}
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop">Shop</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Menu</Link>
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {levels.map((level) => {
          const unlocked = isLevelUnlocked(level.prerequisites)
          const completed = completedLevels.includes(level.id)
          const skipped = skippedLevels.includes(level.id)
          const skipCost = level.payout * 2
          const canAffordSkip = money >= skipCost

          return (
            <Card
              key={level.id}
              data-testid="level-card"
              className={`flex flex-col ${!unlocked ? 'opacity-50' : ''} ${skipped ? 'border-orange-500' : completed ? 'border-green-500' : ''}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{level.title}</CardTitle>
                <p data-testid="client-name" className="text-sm text-muted-foreground">
                  {level.client.name}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <p data-testid="brief" className="text-sm text-muted-foreground">
                  {level.client.brief}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex w-full justify-between">
                  <span data-testid="difficulty" className="text-yellow-500">
                    {'★'.repeat(level.difficulty)}
                  </span>
                  <span data-testid="payout" className="font-mono text-green-500">
                    ${level.payout}
                  </span>
                </div>
                {unlocked ? (
                  <div className="flex w-full gap-2">
                    <Button asChild className="flex-1" size="sm">
                      <Link to={`/mission/${level.id}`}>
                        {completed ? 'Replay' : 'Accept Contract'}
                      </Link>
                    </Button>
                    {!completed && canAffordSkip && (
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid="skip-button"
                        className="text-orange-400 hover:text-orange-300"
                        onClick={() => setSkipConfirm({ levelId: level.id, cost: skipCost, payout: level.payout })}
                      >
                        Skip ${skipCost}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p data-testid="locked-label" className="w-full text-center text-sm text-muted-foreground">
                    Locked
                  </p>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
      <Dialog open={!!skipConfirm} onOpenChange={(open) => !open && setSkipConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Level?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Skip this level for <span className="font-bold text-orange-400">${skipConfirm?.cost}</span>?
            You won't earn the ${skipConfirm?.payout} reward. Levels that require this one will be unlocked.
            You can come back and solve it later for the full payout.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipConfirm(null)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSkipConfirm}
            >
              Skip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/screens/__tests__/ClientBoard.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Run full test suite + type check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add src/screens/ClientBoard.tsx src/screens/__tests__/ClientBoard.test.tsx
git commit -m "feat: add skip level UI to ClientBoard with confirmation dialog"
```

---

### Task 3: Fix Mission.tsx wasAlreadyCompleted for skipped levels

**Files:**
- Modify: `src/screens/Mission.tsx:47-53`

When a player enters a previously-skipped level to solve it, `wasAlreadyCompleted` is set to `true` (because skipped levels ARE in `completedLevels`). This causes `LevelCompleteModal` to show "Already completed" instead of the payout. Fix this by checking `skippedLevels`.

- [ ] **Step 1: Fix the wasAlreadyCompleted logic**

In `src/screens/Mission.tsx`, update the `useEffect` (around line 47-53). Change:

```typescript
    const { completedLevels: completed, inProgressCSS: saved } = useGameStore.getState()
```

to:

```typescript
    const { completedLevels: completed, skippedLevels: skipped, inProgressCSS: saved } = useGameStore.getState()
```

And change:

```typescript
    setWasAlreadyCompleted(completed.includes(levelId))
```

to:

```typescript
    setWasAlreadyCompleted(completed.includes(levelId) && !skipped.includes(levelId))
```

This way, skipped levels are treated as "not yet completed" for payout display purposes, even though they're in `completedLevels` for prerequisite unlocking.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add src/screens/Mission.tsx
git commit -m "fix: show payout in LevelCompleteModal when solving previously-skipped level"
```

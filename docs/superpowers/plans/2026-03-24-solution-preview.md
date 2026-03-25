# Solution Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shop tool that shows the correct CSS result side-by-side with the player's live preview.

**Architecture:** A new `'solution-preview'` tool is added to the type system and shop. When owned, Mission renders two LivePreview instances side-by-side — one with player CSS, one with solution CSS. LivePreview gains an optional `label` prop to customize its header text.

**Tech Stack:** React 19, TypeScript, Vitest, Zustand, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-24-solution-preview-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add `'solution-preview'` to `ToolId`, add entry to `SHOP_ITEMS` |
| `src/components/LivePreview.tsx` | Modify | Add optional `label` prop (default `"Preview"`) |
| `src/screens/Mission.tsx` | Modify | Add split layout, second LivePreview, tool gating |
| `src/components/__tests__/LivePreview.test.tsx` | Create | Tests for the `label` prop |
| `src/screens/__tests__/Mission.test.tsx` | Modify | Tests for split view rendering |
| `src/screens/__tests__/Shop.test.tsx` | Modify | Test for new shop item |

---

### Task 1: Add `solution-preview` to types and shop data

**Files:**
- Modify: `src/types/index.ts:43-49` (ToolId union)
- Modify: `src/types/index.ts:58-94` (SHOP_ITEMS array)

- [ ] **Step 1: Add `'solution-preview'` to the `ToolId` union**

In `src/types/index.ts`, add the new variant to the union (line 48, before `'client-call'`):

```typescript
export type ToolId =
  | 'syntax-highlighter'
  | 'bug-detector'
  | 'property-hint'
  | 'solution-peek'
  | 'solution-preview'
  | 'client-call'
```

- [ ] **Step 2: Add `SHOP_ITEMS` entry**

Add after the `client-call` entry (end of the array, before the closing `]`):

```typescript
  {
    id: 'solution-preview',
    name: 'Solution Preview',
    description: 'See the correct result side-by-side with your preview.',
    price: 100,
    consumable: false,
  },
```

- [ ] **Step 3: Run build to verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add solution-preview tool to types and shop data"
```

---

### Task 2: Add optional `label` prop to LivePreview

**Files:**
- Modify: `src/components/LivePreview.tsx:4-8` (props interface), `src/components/LivePreview.tsx:28` (h3 element)
- Create: `src/components/__tests__/LivePreview.test.tsx`

- [ ] **Step 1: Write failing tests for label prop**

Create `src/components/__tests__/LivePreview.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LivePreview } from '../LivePreview'

describe('LivePreview', () => {
  const defaultProps = {
    html: '<p>Hello</p>',
    css: 'p { color: red; }',
    onIframeReady: vi.fn(),
  }

  it('renders default "Preview" label when no label prop', () => {
    render(<LivePreview {...defaultProps} />)
    expect(screen.getByText('Preview')).toBeInTheDocument()
  })

  it('renders custom label when label prop is provided', () => {
    render(<LivePreview {...defaultProps} label="My Result" />)
    expect(screen.getByText('My Result')).toBeInTheDocument()
    expect(screen.queryByText('Preview')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/LivePreview.test.tsx`
Expected: The custom label test fails (second test), since LivePreview doesn't accept `label` yet.

- [ ] **Step 3: Implement the label prop**

In `src/components/LivePreview.tsx`, update the interface and component:

```typescript
interface LivePreviewProps {
  html: string
  css: string
  onIframeReady: (doc: Document) => void
  label?: string
}

export function LivePreview({ html, css, onIframeReady, label = 'Preview' }: LivePreviewProps) {
```

And change line 28 from:

```tsx
<h3 className="bg-muted/50 px-3 py-2 text-sm text-muted-foreground">Preview</h3>
```

to:

```tsx
<h3 className="bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{label}</h3>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/LivePreview.test.tsx`
Expected: Both tests PASS

- [ ] **Step 5: Run full test suite to verify no regressions**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/LivePreview.tsx src/components/__tests__/LivePreview.test.tsx
git commit -m "feat: add optional label prop to LivePreview"
```

---

### Task 3: Add split-view layout to Mission

**Files:**
- Modify: `src/screens/Mission.tsx:100-103` (tool flags), `src/screens/Mission.tsx:137-148` (right panel JSX)

- [ ] **Step 1: Write failing test for split view**

Add to `src/screens/__tests__/Mission.test.tsx`:

```typescript
  it('renders single preview when solution-preview tool is not owned', () => {
    renderMission('level-01')
    const previews = screen.getAllByTitle('Live Preview')
    expect(previews).toHaveLength(1)
  })

  it('renders two previews side-by-side when solution-preview tool is owned', () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    useGameStore.setState({ ownedTools: ['solution-preview'] })
    renderMission('level-01')
    const previews = screen.getAllByTitle('Live Preview')
    expect(previews).toHaveLength(2)
  })

  it('shows "My Result" and "Correct Answer" labels when solution-preview is owned', () => {
    useGameStore.getState().completeLevel('level-01', 200, 30)
    useGameStore.setState({ ownedTools: ['solution-preview'] })
    renderMission('level-01')
    expect(screen.getByText('My Result')).toBeInTheDocument()
    expect(screen.getByText('Correct Answer')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/screens/__tests__/Mission.test.tsx`
Expected: The two new split-view tests fail

- [ ] **Step 3: Implement the split-view logic in Mission**

In `src/screens/Mission.tsx`:

First, add the no-op callback as a module-level constant (before the `Mission` function):

```typescript
const NOOP = () => {}
```

Then add the tool flag alongside the existing ones (after line 103):

```typescript
  const hasSolutionPreview = ownedTools.includes('solution-preview')
```

Then replace the right panel JSX (lines 137-148):

```tsx
        <div className="flex w-1/2 flex-col">
          <div className={`flex flex-1 overflow-hidden ${hasSolutionPreview ? 'flex-row' : 'flex-col'}`}>
            <div className={hasSolutionPreview ? 'w-1/2' : 'flex-1'}>
              <LivePreview
                html={currentLevel.html}
                css={currentCSS}
                onIframeReady={handleIframeReady}
                label={hasSolutionPreview ? 'My Result' : undefined}
              />
            </div>
            {hasSolutionPreview && (
              <div className="w-1/2 border-l border-border">
                <LivePreview
                  html={currentLevel.html}
                  css={currentLevel.solutionCSS}
                  onIframeReady={NOOP}
                  label="Correct Answer"
                />
              </div>
            )}
            {!hasSolutionPreview && (
              <TestPanel
                tests={currentLevel.tests}
                results={testResults}
                showPropertyHints={hasPropertyHint}
              />
            )}
          </div>
          {hasSolutionPreview && (
            <TestPanel
              tests={currentLevel.tests}
              results={testResults}
              showPropertyHints={hasPropertyHint}
            />
          )}
        </div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/screens/__tests__/Mission.test.tsx`
Expected: All tests PASS (existing + new)

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/screens/Mission.tsx src/screens/__tests__/Mission.test.tsx
git commit -m "feat: add split-view solution preview to Mission screen"
```

---

### Task 4: Add shop test for new item

**Files:**
- Modify: `src/screens/__tests__/Shop.test.tsx`

- [ ] **Step 1: Add test for the new shop item**

Add to `src/screens/__tests__/Shop.test.tsx`:

```typescript
  it('renders Solution Preview item in shop', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('Solution Preview')).toBeInTheDocument()
    expect(screen.getByText(/side-by-side/)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npx vitest run src/screens/__tests__/Shop.test.tsx`
Expected: All tests PASS (the item was already added in Task 1)

- [ ] **Step 3: Commit**

```bash
git add src/screens/__tests__/Shop.test.tsx
git commit -m "test: add shop test for solution preview item"
```

---

### Task 5: Manual verification and final check

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Start dev server and manually verify**

Run: `npm run dev`

Manual checks:
1. Open Shop — "Solution Preview" appears at $100, can be purchased
2. Open a level without the tool — single preview, no labels, works as before
3. Purchase the tool, open a level — two previews appear side-by-side with "My Result" and "Correct Answer" labels
4. The "Correct Answer" preview shows the correct rendering
5. The player's tests still run only against their own CSS
6. On narrow window, the two previews stack vertically

- [ ] **Step 5: Commit any fixes if needed, then final commit**

```bash
git add -A
git commit -m "feat: solution preview tool complete"
```

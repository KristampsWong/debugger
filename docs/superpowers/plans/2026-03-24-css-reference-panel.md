# CSS Reference Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a $75 shop tool that provides a searchable CSS property reference panel on the Mission screen.

**Architecture:** A static data file maps ~35 CSS properties to descriptions/values/examples. A new `CSSReferencePanel` component renders as a slide-over overlay on the editor area, toggled by a button. Mission conditionally shows the toggle when the tool is owned.

**Tech Stack:** React 19, TypeScript, Vitest, Zustand, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-24-steam-review-improvements-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add `'css-reference'` to `ToolId`, add `SHOP_ITEMS` entry |
| `src/data/cssReference.ts` | Create | Static lookup: property → description, values, example |
| `src/components/CSSReferencePanel.tsx` | Create | Slide-over overlay with search + property list |
| `src/screens/Mission.tsx` | Modify | Tool flag, toggle button, render panel |
| `src/components/__tests__/CSSReferencePanel.test.tsx` | Create | Panel rendering, search filtering |
| `src/screens/__tests__/Shop.test.tsx` | Modify | Update shop item count |
| `src/screens/__tests__/Mission.test.tsx` | Modify | Tool flag gating test |

---

### Task 1: Add `css-reference` to types and shop data

**Files:**
- Modify: `src/types/index.ts:43-49` (ToolId union)
- Modify: `src/types/index.ts:59-102` (SHOP_ITEMS array)

- [ ] **Step 1: Add `'css-reference'` to the `ToolId` union**

In `src/types/index.ts`, add the new variant:

```typescript
export type ToolId =
  | 'syntax-highlighter'
  | 'bug-detector'
  | 'property-hint'
  | 'solution-peek'
  | 'solution-preview'
  | 'css-reference'
  | 'client-call'
```

- [ ] **Step 2: Add `SHOP_ITEMS` entry**

Add after the `solution-preview` entry (before the closing `]`):

```typescript
  {
    id: 'css-reference',
    name: 'CSS Reference',
    description: 'Look up CSS property docs without leaving the game.',
    price: 75,
    consumable: false,
  },
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add css-reference tool to types and shop data"
```

---

### Task 2: Create CSS reference data

**Files:**
- Create: `src/data/cssReference.ts`

- [ ] **Step 1: Create the reference data file**

Create `src/data/cssReference.ts` with a typed lookup for all properties used across the 8 levels:

```typescript
export interface CSSPropertyRef {
  property: string
  description: string
  values: string[]
  example: string
}

export const cssReference: CSSPropertyRef[] = [
  {
    property: 'align-items',
    description: 'Aligns flex/grid items along the cross axis.',
    values: ['stretch', 'center', 'flex-start', 'flex-end', 'baseline'],
    example: 'align-items: center;',
  },
  {
    property: 'aspect-ratio',
    description: 'Sets a preferred aspect ratio for the element.',
    values: ['auto', '1/1', '16/9', '4/3'],
    example: 'aspect-ratio: 16/9;',
  },
  {
    property: 'background-color',
    description: 'Sets the background color of an element.',
    values: ['transparent', 'red', '#ff0000', 'rgb(255,0,0)'],
    example: 'background-color: #f0f0f0;',
  },
  {
    property: 'border',
    description: 'Shorthand for border-width, border-style, and border-color.',
    values: ['none', '1px solid black', '2px dashed red'],
    example: 'border: 1px solid #ccc;',
  },
  {
    property: 'border-radius',
    description: 'Rounds the corners of an element.',
    values: ['0', '4px', '50%', '8px 4px'],
    example: 'border-radius: 8px;',
  },
  {
    property: 'color',
    description: 'Sets the text color of an element.',
    values: ['inherit', 'red', '#333', 'rgb(0,0,0)'],
    example: 'color: #333;',
  },
  {
    property: 'cursor',
    description: 'Sets the mouse cursor when hovering the element.',
    values: ['auto', 'pointer', 'default', 'grab', 'not-allowed'],
    example: 'cursor: pointer;',
  },
  {
    property: 'display',
    description: 'Sets the display behavior of an element.',
    values: ['block', 'inline', 'flex', 'grid', 'none', 'inline-block'],
    example: 'display: flex;',
  },
  {
    property: 'flex',
    description: 'Shorthand for flex-grow, flex-shrink, and flex-basis.',
    values: ['0 1 auto', '1', '1 0 0', 'none'],
    example: 'flex: 1;',
  },
  {
    property: 'flex-direction',
    description: 'Sets the direction of flex items in a flex container.',
    values: ['row', 'row-reverse', 'column', 'column-reverse'],
    example: 'flex-direction: column;',
  },
  {
    property: 'flex-shrink',
    description: 'Sets how much a flex item shrinks relative to others.',
    values: ['0', '1', '2'],
    example: 'flex-shrink: 0;',
  },
  {
    property: 'font-family',
    description: 'Sets the font for text content.',
    values: ['serif', 'sans-serif', 'monospace', 'Arial, sans-serif'],
    example: "font-family: 'Helvetica', sans-serif;",
  },
  {
    property: 'font-size',
    description: 'Sets the size of the text.',
    values: ['12px', '1rem', '1.5em', 'large', '100%'],
    example: 'font-size: 16px;',
  },
  {
    property: 'font-weight',
    description: 'Sets the weight (boldness) of the text.',
    values: ['normal', 'bold', '100', '400', '700'],
    example: 'font-weight: bold;',
  },
  {
    property: 'gap',
    description: 'Sets the spacing between flex/grid items.',
    values: ['0', '8px', '1rem', '10px 20px'],
    example: 'gap: 16px;',
  },
  {
    property: 'grid-template-columns',
    description: 'Defines the column structure of a grid container.',
    values: ['1fr', '1fr 1fr', 'repeat(3, 1fr)', '200px auto'],
    example: 'grid-template-columns: repeat(3, 1fr);',
  },
  {
    property: 'height',
    description: 'Sets the height of an element.',
    values: ['auto', '100px', '50%', '100vh'],
    example: 'height: 200px;',
  },
  {
    property: 'justify-content',
    description: 'Aligns flex/grid items along the main axis.',
    values: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'],
    example: 'justify-content: space-between;',
  },
  {
    property: 'left',
    description: 'Sets the left position of a positioned element.',
    values: ['auto', '0', '10px', '50%'],
    example: 'left: 0;',
  },
  {
    property: 'letter-spacing',
    description: 'Sets the spacing between text characters.',
    values: ['normal', '1px', '0.1em', '-0.5px'],
    example: 'letter-spacing: 1px;',
  },
  {
    property: 'line-height',
    description: 'Sets the height of a line of text.',
    values: ['normal', '1.5', '24px', '2'],
    example: 'line-height: 1.5;',
  },
  {
    property: 'list-style',
    description: 'Shorthand for list-style-type, position, and image.',
    values: ['none', 'disc', 'decimal', 'square'],
    example: 'list-style: none;',
  },
  {
    property: 'margin',
    description: 'Sets the outer spacing of an element (shorthand).',
    values: ['0', '10px', '0 auto', '10px 20px 30px 40px'],
    example: 'margin: 0 auto;',
  },
  {
    property: 'max-width',
    description: 'Sets the maximum width of an element.',
    values: ['none', '100%', '600px', '80vw'],
    example: 'max-width: 600px;',
  },
  {
    property: 'min-height',
    description: 'Sets the minimum height of an element.',
    values: ['0', '100px', '50vh', '100%'],
    example: 'min-height: 100vh;',
  },
  {
    property: 'object-fit',
    description: 'Sets how an image/video fits inside its container.',
    values: ['fill', 'contain', 'cover', 'none', 'scale-down'],
    example: 'object-fit: cover;',
  },
  {
    property: 'overflow',
    description: 'Controls what happens when content overflows an element.',
    values: ['visible', 'hidden', 'scroll', 'auto'],
    example: 'overflow: hidden;',
  },
  {
    property: 'padding',
    description: 'Sets the inner spacing of an element (shorthand).',
    values: ['0', '10px', '10px 20px', '10px 20px 30px 40px'],
    example: 'padding: 16px;',
  },
  {
    property: 'position',
    description: 'Sets the positioning method for an element.',
    values: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    example: 'position: relative;',
  },
  {
    property: 'text-align',
    description: 'Sets the horizontal alignment of text content.',
    values: ['left', 'center', 'right', 'justify'],
    example: 'text-align: center;',
  },
  {
    property: 'text-decoration',
    description: 'Sets decorations on text (underline, line-through, etc.).',
    values: ['none', 'underline', 'line-through', 'overline'],
    example: 'text-decoration: none;',
  },
  {
    property: 'text-transform',
    description: 'Controls the capitalization of text.',
    values: ['none', 'uppercase', 'lowercase', 'capitalize'],
    example: 'text-transform: uppercase;',
  },
  {
    property: 'top',
    description: 'Sets the top position of a positioned element.',
    values: ['auto', '0', '10px', '50%'],
    example: 'top: 0;',
  },
  {
    property: 'transform',
    description: 'Applies visual transformations (rotate, scale, translate).',
    values: ['none', 'rotate(45deg)', 'scale(1.5)', 'translateX(10px)'],
    example: 'transform: rotate(45deg);',
  },
  {
    property: 'white-space',
    description: 'Controls how whitespace inside an element is handled.',
    values: ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'],
    example: 'white-space: nowrap;',
  },
  {
    property: 'width',
    description: 'Sets the width of an element.',
    values: ['auto', '100%', '200px', '50vw'],
    example: 'width: 100%;',
  },
  {
    property: 'z-index',
    description: 'Sets the stacking order of positioned elements.',
    values: ['auto', '0', '1', '10', '999', '-1'],
    example: 'z-index: 10;',
  },
]
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/data/cssReference.ts
git commit -m "feat: add CSS property reference data for 37 properties"
```

---

### Task 3: Create CSSReferencePanel component with tests

**Files:**
- Create: `src/components/__tests__/CSSReferencePanel.test.tsx`
- Create: `src/components/CSSReferencePanel.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/CSSReferencePanel.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CSSReferencePanel } from '../CSSReferencePanel'

describe('CSSReferencePanel', () => {
  const defaultProps = { open: true, onClose: vi.fn() }

  it('renders property entries when open', () => {
    render(<CSSReferencePanel {...defaultProps} />)
    expect(screen.getByText('display')).toBeInTheDocument()
    expect(screen.getByText('color')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(<CSSReferencePanel open={false} onClose={vi.fn()} />)
    expect(screen.queryByText('display')).not.toBeInTheDocument()
  })

  it('filters properties by search query', () => {
    render(<CSSReferencePanel {...defaultProps} />)
    const search = screen.getByPlaceholderText('Search properties...')
    fireEvent.change(search, { target: { value: 'flex' } })
    expect(screen.getByText('flex')).toBeInTheDocument()
    expect(screen.getByText('flex-direction')).toBeInTheDocument()
    expect(screen.queryByText('color')).not.toBeInTheDocument()
  })

  it('shows description and example for each property', () => {
    render(<CSSReferencePanel {...defaultProps} />)
    expect(screen.getByText('Sets the display behavior of an element.')).toBeInTheDocument()
    expect(screen.getByText('display: flex;')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<CSSReferencePanel open={true} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close reference panel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<CSSReferencePanel open={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/CSSReferencePanel.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement CSSReferencePanel**

Create `src/components/CSSReferencePanel.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { cssReference } from '../data/cssReference'

interface CSSReferencePanelProps {
  open: boolean
  onClose: () => void
}

export function CSSReferencePanel({ open, onClose }: CSSReferencePanelProps) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const filtered = query
    ? cssReference.filter((ref) => ref.property.includes(query.toLowerCase()))
    : cssReference

  return (
    <div
      className="absolute inset-y-0 right-0 z-10 flex w-[300px] flex-col border-l border-border bg-background shadow-lg"
      data-testid="css-reference-panel"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-sm font-medium">CSS Reference</h3>
        <button
          onClick={onClose}
          aria-label="Close reference panel"
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className="border-b border-border px-3 py-2">
        <input
          type="text"
          placeholder="Search properties..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded border border-border bg-muted px-2 py-1 text-sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-3">
          {filtered.map((ref) => (
            <li key={ref.property} className="text-sm">
              <div className="font-mono font-bold text-blue-400">{ref.property}</div>
              <div className="text-muted-foreground">{ref.description}</div>
              <div className="mt-1 font-mono text-xs text-green-400">{ref.example}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Values: {ref.values.join(', ')}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/CSSReferencePanel.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/CSSReferencePanel.tsx src/components/__tests__/CSSReferencePanel.test.tsx
git commit -m "feat: add CSSReferencePanel component with search"
```

---

### Task 4: Integrate CSS Reference Panel into Mission screen

**Files:**
- Modify: `src/screens/Mission.tsx:102-106` (tool flags), `src/screens/Mission.tsx:130-138` (editor area)

- [ ] **Step 1: Write failing test**

Add to `src/screens/__tests__/Mission.test.tsx`:

```typescript
  it('does not show reference button when css-reference tool is not owned', () => {
    renderMission('level-01')
    expect(screen.queryByLabelText('Open CSS reference')).not.toBeInTheDocument()
  })

  it('shows reference button when css-reference tool is owned', () => {
    useGameStore.setState({ ownedTools: ['css-reference'] })
    renderMission('level-01')
    expect(screen.getByLabelText('Open CSS reference')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/screens/__tests__/Mission.test.tsx`
Expected: The two new tests fail

- [ ] **Step 3: Implement the integration**

In `src/screens/Mission.tsx`:

Add the import at the top:
```typescript
import { CSSReferencePanel } from '../components/CSSReferencePanel'
```

Add state and tool flag after existing tool flags (line 106):
```typescript
  const hasCSSReference = ownedTools.includes('css-reference')
  const [showReference, setShowReference] = useState(false)
```

Add `useState` to the existing React import on line 1.

In the editor area (`<div className="w-1/2 border-r border-border">`), wrap the content to add the toggle button and panel. Replace the editor div (lines 131-139):

```tsx
        <div className="relative w-1/2 border-r border-border">
          {hasCSSReference && (
            <button
              onClick={() => setShowReference(!showReference)}
              aria-label="Open CSS reference"
              className="absolute right-2 top-2 z-20 rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              📖 Ref
            </button>
          )}
          <CodeEditor
            value={currentCSS}
            onChange={handleCSSChange}
            bugLines={currentLevel.bugLines}
            showBugDetector={hasBugDetector}
            enableAutocomplete={hasAutocomplete}
          />
          {hasCSSReference && (
            <CSSReferencePanel
              open={showReference}
              onClose={() => setShowReference(false)}
            />
          )}
        </div>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/screens/__tests__/Mission.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/screens/Mission.tsx src/screens/__tests__/Mission.test.tsx
git commit -m "feat: integrate CSS Reference Panel into Mission screen"
```

---

### Task 5: Update shop tests

**Files:**
- Modify: `src/screens/__tests__/Shop.test.tsx`

- [ ] **Step 1: Update shop item count test**

In `src/screens/__tests__/Shop.test.tsx`, find the test that asserts shop card count. Update from `toHaveLength(6)` to `toHaveLength(7)` (6 existing + 1 new css-reference).

Also add:
```typescript
  it('renders CSS Reference item in shop', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('CSS Reference')).toBeInTheDocument()
    expect(screen.getByText(/Look up CSS property docs/)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run shop tests**

Run: `npx vitest run src/screens/__tests__/Shop.test.tsx`
Expected: All tests PASS

- [ ] **Step 3: Run full test suite + type check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/screens/__tests__/Shop.test.tsx
git commit -m "test: update shop tests for CSS Reference tool"
```

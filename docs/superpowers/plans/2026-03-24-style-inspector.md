# Style Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a $250 shop tool that lets players inspect computed styles on elements in the preview iframe via hover tooltips and click-to-pin details.

**Architecture:** A small script injected into the LivePreview iframe listens for mouse events and sends computed styles via `postMessage`. Parent-side components render a hover tooltip overlay and a pinned style details panel. The iframe sandbox is conditionally upgraded to `allow-same-origin allow-scripts` only when the tool is owned.

**Tech Stack:** React 19, TypeScript, Vitest, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-24-steam-review-improvements-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add `'style-inspector'` to `ToolId`, add `SHOP_ITEMS` entry |
| `src/engine/cssInjector.ts` | Modify | Add `includeInspector` param, inject script conditionally |
| `src/components/LivePreview.tsx` | Modify | Accept `hasStyleInspector`, conditional sandbox, forward to buildSrcdoc |
| `src/components/StyleDetailsPanel.tsx` | Create | Pinned element style display panel |
| `src/screens/Mission.tsx` | Modify | Add tool flag, state for inspected styles, pass props |
| `src/engine/__tests__/cssInjector.test.ts` | Modify | Test script injection |
| `src/components/__tests__/LivePreview.test.tsx` | Modify | Test conditional sandbox |
| `src/components/__tests__/StyleDetailsPanel.test.tsx` | Create | Test style display |
| `src/screens/__tests__/Shop.test.tsx` | Modify | Update shop item count |

---

### Task 1: Add `style-inspector` to types and shop data

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `'style-inspector'` to `ToolId`**

```typescript
export type ToolId =
  | 'syntax-highlighter'
  | 'bug-detector'
  | 'property-hint'
  | 'solution-peek'
  | 'solution-preview'
  | 'css-reference'
  | 'enhanced-errors'
  | 'style-inspector'
  | 'client-call'
```

- [ ] **Step 2: Add `SHOP_ITEMS` entry**

Add after the `enhanced-errors` entry:

```typescript
  {
    id: 'style-inspector',
    name: 'Style Inspector',
    description: 'Hover and click elements in the preview to see their computed styles.',
    price: 250,
    consumable: false,
  },
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add style-inspector tool to types and shop data"
```

---

### Task 2: Add inspector script injection to cssInjector

**Files:**
- Modify: `src/engine/cssInjector.ts`
- Modify: `src/engine/__tests__/cssInjector.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/engine/__tests__/cssInjector.test.ts`:

```typescript
  it('does not include inspector script by default', () => {
    const result = buildSrcdoc('<p>Hi</p>', 'p{}')
    expect(result).not.toContain('__inspector__')
  })

  it('does not include inspector script when includeInspector is false', () => {
    const result = buildSrcdoc('<p>Hi</p>', 'p{}', false)
    expect(result).not.toContain('__inspector__')
  })

  it('includes inspector script when includeInspector is true', () => {
    const result = buildSrcdoc('<p>Hi</p>', 'p{}', true)
    expect(result).toContain('__inspector__')
    expect(result).toContain('postMessage')
    expect(result).toContain('<script>')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/cssInjector.test.ts`
Expected: Tests about `includeInspector` fail

- [ ] **Step 3: Implement the script injection**

Update `src/engine/cssInjector.ts`:

```typescript
const INSPECTOR_SCRIPT = `
<style>
  .__inspector_outline__ { outline: 2px solid #3b82f6 !important; }
</style>
<script>
(function __inspector__() {
  let pinned = null;
  const PROPS = [
    'color','background-color','display','position',
    'padding','margin','font-size','font-weight',
    'width','height','flex-direction','justify-content',
    'align-items','z-index','overflow','border-radius',
    'gap','grid-template-columns','object-fit','transform'
  ];

  function getStyles(el) {
    const cs = getComputedStyle(el);
    const styles = {};
    PROPS.forEach(function(p) { styles[p] = cs.getPropertyValue(p); });
    return styles;
  }

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.className && typeof el.className === 'string') return el.tagName.toLowerCase() + '.' + el.className.split(' ').join('.');
    return el.tagName.toLowerCase();
  }

  document.addEventListener('mouseover', function(e) {
    if (pinned) return;
    var t = e.target;
    if (t === document.body || t === document.documentElement) return;
    t.classList.add('__inspector_outline__');
    parent.postMessage({ type: 'inspector-hover', selector: getSelector(t), styles: getStyles(t), x: e.clientX, y: e.clientY }, '*');
  });

  document.addEventListener('mouseout', function(e) {
    if (pinned) return;
    e.target.classList.remove('__inspector_outline__');
    parent.postMessage({ type: 'inspector-hover-end' }, '*');
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    var t = e.target;
    if (t === document.body || t === document.documentElement) return;
    if (pinned === t) {
      pinned.classList.remove('__inspector_outline__');
      pinned = null;
      parent.postMessage({ type: 'inspector-unpin' }, '*');
      return;
    }
    if (pinned) pinned.classList.remove('__inspector_outline__');
    pinned = t;
    t.classList.add('__inspector_outline__');
    parent.postMessage({ type: 'inspector-pin', selector: getSelector(t), styles: getStyles(t) }, '*');
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pinned) {
      pinned.classList.remove('__inspector_outline__');
      pinned = null;
      parent.postMessage({ type: 'inspector-unpin' }, '*');
    }
  });
})();
</script>`

export function buildSrcdoc(html: string, css: string, includeInspector?: boolean): string {
  return \`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>\${css}</style>
</head>
<body>
\${html}\${includeInspector ? INSPECTOR_SCRIPT : ''}
</body>
</html>\`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/cssInjector.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/cssInjector.ts src/engine/__tests__/cssInjector.test.ts
git commit -m "feat: add conditional inspector script injection to buildSrcdoc"
```

---

### Task 3: Update LivePreview for conditional sandbox and inspector flag

**Files:**
- Modify: `src/components/LivePreview.tsx`
- Modify: `src/components/__tests__/LivePreview.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/components/__tests__/LivePreview.test.tsx`:

```typescript
  it('uses allow-same-origin sandbox by default', () => {
    render(<LivePreview {...defaultProps} />)
    const iframe = document.querySelector('iframe')
    expect(iframe?.getAttribute('sandbox')).toBe('allow-same-origin')
  })

  it('adds allow-scripts to sandbox when hasStyleInspector is true', () => {
    render(<LivePreview {...defaultProps} hasStyleInspector={true} />)
    const iframe = document.querySelector('iframe')
    expect(iframe?.getAttribute('sandbox')).toBe('allow-same-origin allow-scripts')
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/LivePreview.test.tsx`
Expected: The `allow-scripts` test fails

- [ ] **Step 3: Implement the changes**

Update `src/components/LivePreview.tsx`:

```typescript
import { useRef, useEffect, useCallback } from 'react'
import { buildSrcdoc } from '../engine/cssInjector'

interface LivePreviewProps {
  html: string
  css: string
  onIframeReady: (doc: Document) => void
  label?: string
  hasStyleInspector?: boolean
}

export function LivePreview({ html, css, onIframeReady, label = 'Preview', hasStyleInspector = false }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    if (doc) {
      onIframeReady(doc)
    }
  }, [onIframeReady])

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = buildSrcdoc(html, css, hasStyleInspector)
    }
  }, [html, css, hasStyleInspector])

  const sandbox = hasStyleInspector ? 'allow-same-origin allow-scripts' : 'allow-same-origin'

  return (
    <div className="flex flex-1 flex-col border-b border-border">
      <h3 className="bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{label}</h3>
      <iframe
        ref={iframeRef}
        sandbox={sandbox}
        title="Live Preview"
        onLoad={handleLoad}
        className="w-full flex-1 border-none bg-white"
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/LivePreview.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/LivePreview.tsx src/components/__tests__/LivePreview.test.tsx
git commit -m "feat: add conditional sandbox and inspector flag to LivePreview"
```

---

### Task 4: Create StyleDetailsPanel component

**Files:**
- Create: `src/components/__tests__/StyleDetailsPanel.test.tsx`
- Create: `src/components/StyleDetailsPanel.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/StyleDetailsPanel.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StyleDetailsPanel } from '../StyleDetailsPanel'

describe('StyleDetailsPanel', () => {
  const sampleStyles = {
    'color': 'rgb(0, 0, 0)',
    'background-color': 'rgb(255, 255, 255)',
    'display': 'block',
    'position': 'static',
    'padding': '0px',
    'margin': '0px',
    'font-size': '16px',
    'font-weight': '400',
    'width': 'auto',
    'height': 'auto',
    'flex-direction': 'row',
    'justify-content': 'normal',
    'align-items': 'normal',
    'z-index': 'auto',
    'overflow': 'visible',
    'border-radius': '0px',
    'gap': 'normal',
    'grid-template-columns': 'none',
    'object-fit': 'fill',
    'transform': 'none',
  }

  it('renders nothing when no styles provided', () => {
    render(<StyleDetailsPanel selector={null} styles={null} onClose={vi.fn()} />)
    expect(screen.queryByTestId('style-details-panel')).not.toBeInTheDocument()
  })

  it('renders selector and styles when provided', () => {
    render(<StyleDetailsPanel selector="h1" styles={sampleStyles} onClose={vi.fn()} />)
    expect(screen.getByTestId('style-details-panel')).toBeInTheDocument()
    expect(screen.getByText('h1')).toBeInTheDocument()
    expect(screen.getByText('rgb(0, 0, 0)')).toBeInTheDocument()
  })

  it('groups styles by category', () => {
    render(<StyleDetailsPanel selector="h1" styles={sampleStyles} onClose={vi.fn()} />)
    expect(screen.getByText('Layout')).toBeInTheDocument()
    expect(screen.getByText('Box Model')).toBeInTheDocument()
    expect(screen.getByText('Typography')).toBeInTheDocument()
    expect(screen.getByText('Colors')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<StyleDetailsPanel selector="h1" styles={sampleStyles} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close inspector'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/StyleDetailsPanel.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement StyleDetailsPanel**

Create `src/components/StyleDetailsPanel.tsx`:

```typescript
interface StyleDetailsPanelProps {
  selector: string | null
  styles: Record<string, string> | null
  onClose: () => void
}

const CATEGORIES: Record<string, string[]> = {
  Layout: ['display', 'position', 'flex-direction', 'justify-content', 'align-items', 'grid-template-columns', 'gap', 'overflow', 'z-index'],
  'Box Model': ['width', 'height', 'padding', 'margin', 'border-radius', 'object-fit'],
  Typography: ['font-size', 'font-weight', 'transform'],
  Colors: ['color', 'background-color'],
}

export function StyleDetailsPanel({ selector, styles, onClose }: StyleDetailsPanelProps) {
  if (!selector || !styles) return null

  return (
    <div
      className="max-h-[200px] overflow-y-auto border-t border-border bg-muted/50 p-3"
      data-testid="style-details-panel"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-blue-400">{selector}</span>
        <button
          onClick={onClose}
          aria-label="Close inspector"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(CATEGORIES).map(([category, props]) => (
          <div key={category}>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">{category}</h4>
            <ul className="flex flex-col gap-0.5">
              {props.map((prop) => (
                <li key={prop} className="flex justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{prop}</span>
                  <span className="font-mono">{styles[prop] ?? ''}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/StyleDetailsPanel.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/StyleDetailsPanel.tsx src/components/__tests__/StyleDetailsPanel.test.tsx
git commit -m "feat: add StyleDetailsPanel component for pinned element styles"
```

---

### Task 5: Integrate Style Inspector into Mission screen

**Files:**
- Modify: `src/screens/Mission.tsx`

- [ ] **Step 1: Add state, tool flag, and message listener**

In `src/screens/Mission.tsx`:

Add import:
```typescript
import { StyleDetailsPanel } from '../components/StyleDetailsPanel'
```

Add tool flag after existing flags:
```typescript
  const hasStyleInspector = ownedTools.includes('style-inspector')
```

Add state for pinned element:
```typescript
  const [pinnedStyles, setPinnedStyles] = useState<{ selector: string; styles: Record<string, string> } | null>(null)
```

Add a `useEffect` for listening to postMessage from the iframe:
```typescript
  useEffect(() => {
    if (!hasStyleInspector) return
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data.type !== 'string') return
      if (e.data.type === 'inspector-pin') {
        setPinnedStyles({ selector: e.data.selector, styles: e.data.styles })
      } else if (e.data.type === 'inspector-unpin') {
        setPinnedStyles(null)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [hasStyleInspector])
```

Pass `hasStyleInspector` to all LivePreview instances. For the player's preview:
```tsx
<LivePreview
  html={currentLevel.html}
  css={currentCSS}
  onIframeReady={handleIframeReady}
  hasStyleInspector={hasStyleInspector}
/>
```

Note: Do NOT pass `hasStyleInspector` to the solution preview LivePreview (spec says inspector only works on player's preview).

Add StyleDetailsPanel below the preview area, before or inside TestPanel's parent. Insert it after the LivePreview (or after the split-view container) but before TestPanel:

```tsx
{hasStyleInspector && (
  <StyleDetailsPanel
    selector={pinnedStyles?.selector ?? null}
    styles={pinnedStyles?.styles ?? null}
    onClose={() => setPinnedStyles(null)}
  />
)}
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/screens/Mission.tsx
git commit -m "feat: integrate Style Inspector into Mission screen"
```

---

### Task 6: Update shop tests

**Files:**
- Modify: `src/screens/__tests__/Shop.test.tsx`

- [ ] **Step 1: Update shop item count and add test**

Update shop card count assertion from `8` to `9` (adding style-inspector).

Add:
```typescript
  it('renders Style Inspector item in shop', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('Style Inspector')).toBeInTheDocument()
    expect(screen.getByText(/computed styles/)).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run shop tests**

Run: `npx vitest run src/screens/__tests__/Shop.test.tsx`
Expected: All tests PASS

- [ ] **Step 3: Run full suite + type check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/screens/__tests__/Shop.test.tsx
git commit -m "test: update shop tests for Style Inspector tool"
```

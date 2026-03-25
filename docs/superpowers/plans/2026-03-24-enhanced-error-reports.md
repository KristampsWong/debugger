# Enhanced Error Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a $200 shop tool that upgrades test failure feedback with visual diffs in TestPanel and squiggly underlines in the Monaco editor.

**Architecture:** The test runner populates a new optional `failureDetail` field (backward compatible). TestPanel expands failed rows to show expected/actual with color swatches. CodeEditor maps failure details to CSS lines and renders Monaco `deltaDecorations` with squiggly underlines and hover tooltips.

**Tech Stack:** React 19, TypeScript, Vitest, Zustand, Monaco Editor, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-24-steam-review-improvements-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add `'enhanced-errors'` to `ToolId`, add `SHOP_ITEMS` entry, add `failureDetail` to `TestResult` |
| `src/engine/testRunner.ts` | Modify | Populate `failureDetail` on failures |
| `src/components/TestPanel.tsx` | Modify | Expandable error details with color swatches |
| `src/components/CodeEditor.tsx` | Modify | Accept `testResults` + `hasEnhancedErrors` props, add squiggly decorations |
| `src/screens/Mission.tsx` | Modify | Add tool flag, pass props to components |
| `src/engine/__tests__/testRunner.test.ts` | Modify | Verify `failureDetail` populated |
| `src/components/__tests__/TestPanel.test.tsx` | Modify | Enhanced error display tests |
| `src/screens/__tests__/Shop.test.tsx` | Modify | Update shop item count |

---

### Task 1: Add `enhanced-errors` to types

**Files:**
- Modify: `src/types/index.ts:37-41` (TestResult), `src/types/index.ts:43-49` (ToolId), `src/types/index.ts:59-102` (SHOP_ITEMS)

- [ ] **Step 1: Add `failureDetail` to `TestResult`**

In `src/types/index.ts`, update the `TestResult` interface:

```typescript
export interface TestResult {
  testId: string
  passed: boolean
  failedAssertion?: string
  failureDetail?:
    | { type: 'mismatch'; selector: string; property: string; expected: string; actual: string }
    | { type: 'not-found'; selector: string }
}
```

- [ ] **Step 2: Add `'enhanced-errors'` to `ToolId`**

```typescript
export type ToolId =
  | 'syntax-highlighter'
  | 'bug-detector'
  | 'property-hint'
  | 'solution-peek'
  | 'solution-preview'
  | 'css-reference'
  | 'enhanced-errors'
  | 'client-call'
```

- [ ] **Step 3: Add `SHOP_ITEMS` entry**

Add after the `css-reference` entry:

```typescript
  {
    id: 'enhanced-errors',
    name: 'Enhanced Error Reports',
    description: 'Visual diffs for failing tests and inline error markers in the editor.',
    price: 200,
    consumable: false,
  },
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add enhanced-errors tool type and failureDetail to TestResult"
```

---

### Task 2: Populate `failureDetail` in test runner

**Files:**
- Modify: `src/engine/testRunner.ts:40-66`
- Modify: `src/engine/__tests__/testRunner.test.ts`

- [ ] **Step 1: Write failing tests for `failureDetail`**

Add to `src/engine/__tests__/testRunner.test.ts`:

```typescript
  describe('failureDetail', () => {
    it('populates not-found detail when element is missing', () => {
      document.body.innerHTML = '<p>Hello</p>'
      const tests: Test[] = [
        {
          id: 't1',
          description: 'test',
          assertions: [{ selector: '.missing', property: 'color', expected: 'red' }],
        },
      ]
      const results = runTests(tests, document)
      expect(results[0].failureDetail).toEqual({
        type: 'not-found',
        selector: '.missing',
      })
    })

    it('populates mismatch detail when value does not match', () => {
      document.body.innerHTML = '<p style="color: rgb(0, 0, 0)">Hello</p>'
      const tests: Test[] = [
        {
          id: 't1',
          description: 'test',
          assertions: [{ selector: 'p', property: 'color', expected: 'rgb(255, 0, 0)' }],
        },
      ]
      const results = runTests(tests, document)
      expect(results[0].failureDetail).toEqual({
        type: 'mismatch',
        selector: 'p',
        property: 'color',
        expected: 'rgb(255, 0, 0)',
        actual: 'rgb(0, 0, 0)',
      })
    })

    it('does not populate failureDetail when test passes', () => {
      document.body.innerHTML = '<p style="color: rgb(255, 0, 0)">Hello</p>'
      const tests: Test[] = [
        {
          id: 't1',
          description: 'test',
          assertions: [{ selector: 'p', property: 'color', expected: 'rgb(255, 0, 0)' }],
        },
      ]
      const results = runTests(tests, document)
      expect(results[0].failureDetail).toBeUndefined()
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/testRunner.test.ts`
Expected: The new failureDetail tests fail

- [ ] **Step 3: Implement failureDetail in testRunner**

In `src/engine/testRunner.ts`, update the two failure return statements:

For element not found (line 45-49):
```typescript
        return {
          testId: test.id,
          passed: false,
          failedAssertion: `"${assertion.selector}" — element not found`,
          failureDetail: { type: 'not-found' as const, selector: assertion.selector },
        }
```

For value mismatch (line 55-60):
```typescript
        return {
          testId: test.id,
          passed: false,
          failedAssertion: `"${assertion.selector}" ${assertion.property}: expected "${assertion.expected}", got "${actual}"`,
          failureDetail: {
            type: 'mismatch' as const,
            selector: assertion.selector,
            property: assertion.property,
            expected: assertion.expected,
            actual,
          },
        }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/testRunner.test.ts`
Expected: All tests PASS (new + existing)

- [ ] **Step 5: Commit**

```bash
git add src/engine/testRunner.ts src/engine/__tests__/testRunner.test.ts
git commit -m "feat: populate failureDetail in test runner"
```

---

### Task 3: Add enhanced error display to TestPanel

**Files:**
- Modify: `src/components/TestPanel.tsx`
- Modify: `src/components/__tests__/TestPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/components/__tests__/TestPanel.test.tsx`:

```typescript
  describe('enhanced errors', () => {
    const failedResults: TestResult[] = [
      {
        testId: 'test-1',
        passed: true,
      },
      {
        testId: 'test-2',
        passed: false,
        failedAssertion: '"h1" color: expected "rgb(255, 0, 0)", got "rgb(0, 0, 0)"',
        failureDetail: {
          type: 'mismatch',
          selector: 'h1',
          property: 'color',
          expected: 'rgb(255, 0, 0)',
          actual: 'rgb(0, 0, 0)',
        },
      },
    ]

    it('shows expected and actual values when enhanced errors enabled', () => {
      render(
        <TestPanel
          tests={sampleTests}
          results={failedResults}
          showPropertyHints={false}
          showEnhancedErrors={true}
        />
      )
      expect(screen.getByText(/Expected:/)).toBeInTheDocument()
      expect(screen.getByText(/rgb\(255, 0, 0\)/)).toBeInTheDocument()
      expect(screen.getByText(/Actual:/)).toBeInTheDocument()
      expect(screen.getByText(/rgb\(0, 0, 0\)/)).toBeInTheDocument()
    })

    it('renders color swatches for color properties', () => {
      render(
        <TestPanel
          tests={sampleTests}
          results={failedResults}
          showPropertyHints={false}
          showEnhancedErrors={true}
        />
      )
      const swatches = screen.getAllByTestId('color-swatch')
      expect(swatches).toHaveLength(2)
    })

    it('does not show enhanced details when tool not owned', () => {
      render(
        <TestPanel
          tests={sampleTests}
          results={failedResults}
          showPropertyHints={false}
          showEnhancedErrors={false}
        />
      )
      expect(screen.queryByText(/Expected:/)).not.toBeInTheDocument()
    })

    it('shows element-not-found message for not-found failures', () => {
      const notFoundResults: TestResult[] = [
        {
          testId: 'test-1',
          passed: false,
          failedAssertion: '".missing" — element not found',
          failureDetail: { type: 'not-found', selector: '.missing' },
        },
      ]
      render(
        <TestPanel
          tests={sampleTests}
          results={notFoundResults}
          showPropertyHints={false}
          showEnhancedErrors={true}
        />
      )
      expect(screen.getByText(/Element not found:/)).toBeInTheDocument()
      expect(screen.getByText(/\.missing/)).toBeInTheDocument()
    })
  })
```

Add the `TestResult` import at the top of the test file:
```typescript
import type { Test, TestResult } from '../../types'
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/__tests__/TestPanel.test.tsx`
Expected: New tests fail (showEnhancedErrors prop doesn't exist)

- [ ] **Step 3: Implement enhanced error display in TestPanel**

Update `src/components/TestPanel.tsx`:

```typescript
import type { Test, TestResult } from '../types'

const COLOR_PROPERTIES = new Set([
  'color', 'background-color', 'border-color',
  'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color', 'outline-color',
])

interface TestPanelProps {
  tests: Test[]
  results: TestResult[]
  showPropertyHints: boolean
  showEnhancedErrors?: boolean
}

export function TestPanel({ tests, results, showPropertyHints, showEnhancedErrors = false }: TestPanelProps) {
  const getResult = (testId: string) => results.find((r) => r.testId === testId)

  return (
    <div className="max-h-[250px] overflow-y-auto bg-muted/50 p-3" data-testid="test-panel">
      <h3 className="mb-2 text-sm text-muted-foreground">Tests</h3>
      <ul className="flex list-none flex-col gap-1.5">
        {tests.map((test) => {
          const result = getResult(test.id)
          const status = result ? (result.passed ? 'passed' : 'failed') : 'pending'

          return (
            <li
              key={test.id}
              role="listitem"
              data-testid="test-item"
              data-status={status}
              className={`flex flex-col gap-1 rounded px-2 py-1.5 text-sm ${
                status === 'passed'
                  ? 'text-green-500'
                  : status === 'failed'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 font-mono font-bold">
                  {status === 'passed' ? '✓' : status === 'failed' ? '✗' : '○'}
                </span>
                <span data-testid="test-description">{test.description}</span>
                {showPropertyHints && (
                  <span data-testid="test-hints" className="ml-auto font-mono text-xs text-muted-foreground">
                    {test.assertions.map((a) => a.property).join(', ')}
                  </span>
                )}
              </div>
              {showEnhancedErrors && result && !result.passed && result.failureDetail && (
                <div className="ml-6 rounded bg-muted p-2 text-xs" data-testid="error-detail">
                  {result.failureDetail.type === 'not-found' ? (
                    <span>Element not found: <code className="font-mono text-yellow-400">{result.failureDetail.selector}</code></span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>Expected:</span>
                        {COLOR_PROPERTIES.has(result.failureDetail.property) && (
                          <span
                            data-testid="color-swatch"
                            className="inline-block h-3 w-3 rounded border border-border"
                            style={{ backgroundColor: result.failureDetail.expected }}
                          />
                        )}
                        <code className="font-mono text-green-400">{result.failureDetail.expected}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Actual:</span>
                        {COLOR_PROPERTIES.has(result.failureDetail.property) && (
                          <span
                            data-testid="color-swatch"
                            className="inline-block h-3 w-3 rounded border border-border"
                            style={{ backgroundColor: result.failureDetail.actual }}
                          />
                        )}
                        <code className="font-mono text-red-400">{result.failureDetail.actual}</code>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/__tests__/TestPanel.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TestPanel.tsx src/components/__tests__/TestPanel.test.tsx
git commit -m "feat: add enhanced error display to TestPanel with color swatches"
```

---

### Task 4: Add squiggly underlines to CodeEditor

**Files:**
- Modify: `src/components/CodeEditor.tsx`

- [ ] **Step 1: Update CodeEditor to accept new props and render decorations**

In `src/components/CodeEditor.tsx`, update the interface and implementation:

```typescript
import Editor from '@monaco-editor/react'
import type { TestResult } from '../types'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  bugLines?: number[]
  showBugDetector: boolean
  enableAutocomplete: boolean
  testResults?: TestResult[]
  hasEnhancedErrors?: boolean
}

function findPropertyLine(css: string, property: string, selector: string): number | null {
  const lines = css.split('\n')
  let currentSelector = ''
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.endsWith('{')) {
      currentSelector = line.replace(/\s*\{$/, '').trim()
    }
    if (line.includes(property + ':') || line.includes(property + ' :')) {
      if (!selector || currentSelector.includes(selector.replace(/"/g, ''))) {
        return i + 1
      }
    }
  }
  // Fallback: find any line with the property
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(property + ':') || lines[i].includes(property + ' :')) {
      return i + 1
    }
  }
  return null
}

export function CodeEditor({
  value,
  onChange,
  bugLines = [],
  showBugDetector,
  enableAutocomplete,
  testResults = [],
  hasEnhancedErrors = false,
}: CodeEditorProps) {
  const handleEditorMount = (editor: any, monaco: any) => {
    if (showBugDetector && bugLines.length > 0) {
      const decorations = bugLines.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: 'bug-gutter-icon',
          glyphMarginHoverMessage: { value: 'Bug detected on this line' },
        },
      }))
      editor.deltaDecorations([], decorations)
    }

    if (hasEnhancedErrors) {
      const errorDecorations: any[] = []
      for (const result of testResults) {
        if (result.passed || !result.failureDetail) continue
        if (result.failureDetail.type !== 'mismatch') continue
        const { property, selector, expected, actual } = result.failureDetail
        const line = findPropertyLine(value, property, selector)
        if (line === null) continue
        errorDecorations.push({
          range: new monaco.Range(line, 1, line, 1000),
          options: {
            className: 'squiggly-error',
            hoverMessage: {
              value: `Expected \`${property}\` to be \`${expected}\` but got \`${actual}\``,
            },
            inlineClassName: 'squiggly-error-inline',
          },
        })
      }
      if (errorDecorations.length > 0) {
        editor.deltaDecorations([], errorDecorations)
      }
    }
  }

  return (
    <div className="h-full">
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
            enabled: enableAutocomplete || hasEnhancedErrors,
          },
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Add CSS for squiggly underlines**

Add to `src/index.css`:

```css
.squiggly-error-inline {
  text-decoration: wavy underline red;
  text-decoration-skip-ink: none;
}
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/CodeEditor.tsx src/index.css
git commit -m "feat: add squiggly error underlines to CodeEditor"
```

---

### Task 5: Integrate enhanced errors into Mission screen

**Files:**
- Modify: `src/screens/Mission.tsx`

- [ ] **Step 1: Add tool flag and pass props**

In `src/screens/Mission.tsx`, add after existing tool flags:

```typescript
  const hasEnhancedErrors = ownedTools.includes('enhanced-errors')
```

Update the CodeEditor usage to pass new props:

```tsx
          <CodeEditor
            value={currentCSS}
            onChange={handleCSSChange}
            bugLines={currentLevel.bugLines}
            showBugDetector={hasBugDetector}
            enableAutocomplete={hasAutocomplete}
            testResults={testResults}
            hasEnhancedErrors={hasEnhancedErrors}
          />
```

Update both TestPanel usages (in the hasSolutionPreview branch and the else branch) to pass the new prop:

```tsx
              <TestPanel
                tests={currentLevel.tests}
                results={testResults}
                showPropertyHints={hasPropertyHint}
                showEnhancedErrors={hasEnhancedErrors}
              />
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/screens/Mission.tsx
git commit -m "feat: wire enhanced-errors tool flag into Mission screen"
```

---

### Task 6: Update shop tests

**Files:**
- Modify: `src/screens/__tests__/Shop.test.tsx`

- [ ] **Step 1: Update shop item count and add new test**

Update the shop card count assertion from `6` to `8` (now includes css-reference + enhanced-errors).

Add:
```typescript
  it('renders Enhanced Error Reports item in shop', () => {
    render(
      <MemoryRouter>
        <Shop />
      </MemoryRouter>
    )
    expect(screen.getByText('Enhanced Error Reports')).toBeInTheDocument()
    expect(screen.getByText(/Visual diffs/)).toBeInTheDocument()
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
git commit -m "test: update shop tests for Enhanced Error Reports tool"
```

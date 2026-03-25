# Steam Review-Inspired Improvements — Design Spec

## Summary

Add 4 new features inspired by user reviews of similar Steam games (Super Markup Man, Move Code Lines). Three are permanent shop tools that enhance the debugging experience; one is a per-level skip mechanic available to all players. All features follow Approach A (independent, no dependencies between them).

## Motivation

User reviews of similar games consistently cite these pain points:
- **Useless error messages** — generic "ERROR" with no actionable detail
- **No reference material** — players must alt-tab to MDN to understand CSS properties
- **No way to inspect elements** — can't see computed styles without browser DevTools
- **Getting stuck with no escape** — no way to skip a frustrating level, leading to abandonment

These features address each pain point while fitting into the existing shop economy.

---

## Tool 1: CSS Reference Panel

**Shop item:** `css-reference`, $75, permanent

### What It Does
A collapsible sidebar panel on the Mission screen with searchable CSS property documentation. Players look up properties without leaving the game.

### Data
- New file: `src/data/cssReference.ts` — a static lookup object mapping ~30-40 common CSS properties to short descriptions, valid values, and a mini example
- Only properties that appear across the 8 levels need entries

### UI
- Collapsible panel toggled by a book icon button (visible only when tool is owned)
- Search input at top filters properties by name
- Each entry: property name, one-line description, common values, mini example
- Panel starts collapsed to avoid crowding the Mission layout

### Layout
- The panel renders as a slide-over overlay anchored to the right edge of the editor area (left half of Mission)
- It does NOT change the 50/50 editor/preview split — it overlays on top of the editor when open
- Panel width: ~300px with a semi-transparent backdrop
- Clicking outside or pressing Escape closes it

### Integration
- New `ToolId`: `'css-reference'`
- Mission checks `ownedTools.includes('css-reference')` to render the toggle button
- New component: `CSSReferencePanel.tsx`

### Files Affected
| File | Action |
|------|--------|
| `src/types/index.ts` | Add `'css-reference'` to `ToolId`, add `SHOP_ITEMS` entry |
| `src/data/cssReference.ts` | Create — static property lookup data |
| `src/components/CSSReferencePanel.tsx` | Create — collapsible panel component |
| `src/screens/Mission.tsx` | Add tool flag + render toggle button and panel |

---

## Tool 2: Enhanced Error Reports

**Shop item:** `enhanced-errors`, $200, permanent

### What It Does
Upgrades test failure feedback in two ways: an expanded TestPanel with visual diffs, and inline editor annotations with red squiggly underlines.

### Part A — Enhanced TestPanel
- Failed tests expand to show expected vs actual values
- Color properties: render color swatches (small colored squares) next to RGB values
- Layout properties (`width`, `margin`, `padding`): show numeric difference (e.g., "off by 20px")
- Passed tests stay as-is

### Part B — Inline Editor Annotations
- Red squiggly underlines on CSS lines containing failing properties
- Hover tooltip: "Expected `color` to be `rgb(255,0,0)` but got `rgb(0,0,0)`"
- Uses Monaco `deltaDecorations` API (same pattern as Bug Detector gutter markers)
- Annotations update live as player edits CSS and tests re-run

### Mapping Failures to Lines
- Scan CSS text for lines containing the failed property name
- Match against the nearest preceding selector block for disambiguation
- Heuristic-based — sufficient for the structured CSS in these levels

### Data Changes
- Keep `TestResult.failedAssertion` as `string` for backward compatibility
- Add a new optional field `failureDetail` to `TestResult`:
  ```typescript
  failureDetail?:
    | { type: 'mismatch'; selector: string; property: string; expected: string; actual: string }
    | { type: 'not-found'; selector: string }
  ```
- `testRunner.ts` populates `failureDetail` on every failure (always available), while `failedAssertion` string remains unchanged
- TestPanel and CodeEditor consume `failureDetail` when `hasEnhancedErrors` is true; otherwise they ignore it
- This is fully backward compatible — all existing code consuming the string field continues to work

### Integration
- New `ToolId`: `'enhanced-errors'`
- Mission passes `hasEnhancedErrors` flag to TestPanel and CodeEditor
- Without the tool: behavior identical to today (backward compatible)

### Files Affected
| File | Action |
|------|--------|
| `src/types/index.ts` | Add `'enhanced-errors'` to `ToolId`, add `SHOP_ITEMS` entry, add `failureDetail` to `TestResult` |
| `src/engine/testRunner.ts` | Populate `failureDetail` on failures (keep `failedAssertion` string unchanged) |
| `src/components/TestPanel.tsx` | Expand failed tests with visual diff, color swatches when `hasEnhancedErrors` |
| `src/components/CodeEditor.tsx` | Add `testResults` prop + squiggly underline decorations for failing lines |
| `src/screens/Mission.tsx` | Add tool flag, pass `hasEnhancedErrors` and `testResults` to components |

---

## Tool 3: Style Inspector

**Shop item:** `style-inspector`, $250, permanent

### What It Does
Lets players inspect computed styles on elements in the preview iframe. Hover for a quick glance, click to pin and see full details.

### Hover Mode
- Hovering an element in LivePreview shows a floating tooltip with key computed styles (color, background, display, padding, margin, font-size, position)
- Blue outline highlights the hovered element
- Tooltip disappears on mouse leave

### Click Mode
- Clicking pins the element — outline stays, a Style Details panel appears below the preview
- Panel shows computed styles grouped by category (Box Model, Typography, Layout, Colors)
- Click another element to switch; click same element or press Escape to unpin

### Technical Approach
- Inject a small script (~40 lines) into LivePreview iframe's `srcdoc`
- Script listens for `mouseover`, `mouseout`, `click` events
- Uses `postMessage` to send computed style data to parent window
- Conditionally adds `allow-scripts` to iframe sandbox ONLY when `hasStyleInspector` is true (alongside existing `allow-same-origin`). When the tool is not owned, the sandbox remains `allow-same-origin` only.
- Parent-side `message` event listener must validate `event.source === iframeRef.current.contentWindow` before processing messages (security: prevents cross-frame message spoofing)
- The injected inspector script must NOT alter computed styles of user elements — it only adds transient outline styles via a dedicated class that does not affect tested CSS properties. Test execution via `handleIframeReady` runs on the initial DOM load before inspector interactions.

**Security note:** `allow-same-origin` + `allow-scripts` is generally dangerous, but safe here because srcdoc content is entirely application-controlled (HTML from level files + CSS from `<style>` tags). The CSS editor cannot inject `<script>` tags.

### Integration
- New `ToolId`: `'style-inspector'`
- `cssInjector.ts` conditionally includes inspector script when flag is passed
- Mission passes `hasStyleInspector` to LivePreview
- New components: `StyleInspectorOverlay.tsx`, `StyleDetailsPanel.tsx`

### Scope Limits
- Only inspects player's preview iframe, not solution preview
- Read-only — no editing from the inspector
- Limited to ~20 most useful CSS properties

### Files Affected
| File | Action |
|------|--------|
| `src/types/index.ts` | Add `'style-inspector'` to `ToolId`, add `SHOP_ITEMS` entry |
| `src/engine/cssInjector.ts` | Conditionally inject inspector script into srcdoc |
| `src/components/LivePreview.tsx` | Accept `hasStyleInspector` prop, conditionally set sandbox to `allow-same-origin allow-scripts`, forward flag to buildSrcdoc |
| `src/components/StyleInspectorOverlay.tsx` | Create — hover tooltip component |
| `src/components/StyleDetailsPanel.tsx` | Create — pinned style details panel |
| `src/screens/Mission.tsx` | Add tool flag, pass to LivePreview |

---

## Feature 4: Skip Level

**Not a shop tool** — a per-level action available to all players who can afford it.

### What It Does
Players pay 2x the level's payout to skip it and unlock dependent levels. Always a net loss compared to solving.

### How It Works
- On ClientBoard, available (unlocked, not completed) levels show a "Skip ($X)" button alongside "Accept Contract"
- Confirmation dialog: "Skip this level for $X? You won't earn the $Y reward. Levels that require this one will be unlocked."
- On confirm: deducts cost, marks level as completed and skipped
- Skipped levels show distinct visual on board (orange border vs green for completed)
- Skipped levels remain playable — solving later awards the full payout and removes the skipped status

### Pricing
Skip cost is always 2x the level's payout (computed dynamically, not hardcoded per level):

| Level | Payout | Skip Cost (2x) |
|-------|--------|-----------------|
| Level 1 | $100 | $200 |
| Level 2 | $150 | $300 |
| Level 3 | $200 | $400 |
| Level 4 | $200 | $400 |
| Level 5 | $300 | $600 |
| Level 6 | $300 | $600 |
| Level 7 | $400 | $800 |
| Level 8 | $400 | $800 |

### Data Changes
- Add `skippedLevels: string[]` to `GameState` (default `[]` in `initialState`)
- New action: `skipLevel(levelId, cost)` — deducts cost, adds to `completedLevels` and `skippedLevels`
- Modify `completeLevel`: if level is in `skippedLevels`, bypass the `alreadyCompleted` guard — award the payout, remove from `skippedLevels`, keep in `completedLevels`
- Modify `resetGame`: clear `skippedLevels` (add to `initialState`)
- **localStorage migration:** Zustand's `persist` middleware does a shallow merge on hydration, so existing saves without `skippedLevels` will get `undefined`. Add a `version` and `migrate` function to the persist config that defaults missing `skippedLevels` to `[]`

### Files Affected
| File | Action |
|------|--------|
| `src/store/gameStore.ts` | Add `skippedLevels` state, `skipLevel` action, update `completeLevel` |
| `src/screens/ClientBoard.tsx` | Add skip button, confirmation dialog, orange border styling |
| `src/types/index.ts` | Update `GameState` type if defined there |

---

## Testing Strategy

Each tool gets tests for:
1. **Shop presence** — item appears in shop, can be purchased
2. **Feature gating** — feature only active when tool is owned
3. **Core functionality** — the feature works as specified

| Feature | Key Tests |
|---------|-----------|
| CSS Reference Panel | Panel renders when owned, search filters results, hidden when not owned |
| Enhanced Error Reports | Structured failure data returned, color swatches render, squiggly decorations applied, hidden when not owned |
| Style Inspector | postMessage communication works, hover tooltip renders, click pins element, hidden when not owned |
| Skip Level | Skip button visible with sufficient funds, hidden with insufficient funds, level marked as skipped, solving skipped level removes skip status and awards payout |

## Test File Updates

All new and modified test files across the 4 features:

| Test File | Action | What to Test |
|-----------|--------|--------------|
| `src/components/__tests__/CSSReferencePanel.test.tsx` | Create | Panel renders, search filters, entries display correctly |
| `src/components/__tests__/StyleInspectorOverlay.test.tsx` | Create | Hover tooltip renders from postMessage data |
| `src/components/__tests__/StyleDetailsPanel.test.tsx` | Create | Pinned element styles display grouped by category |
| `src/engine/__tests__/testRunner.test.ts` | Modify | Verify `failureDetail` populated on failures (existing string assertions unchanged) |
| `src/components/__tests__/TestPanel.test.tsx` | Modify | Enhanced error display with color swatches and value diffs |
| `src/components/__tests__/CodeEditor.test.tsx` | Create/Modify | Squiggly underline decorations applied from testResults |
| `src/store/__tests__/gameStore.test.ts` | Modify | `skipLevel` action, modified `completeLevel` for skipped levels, `resetGame` clears skippedLevels |
| `src/screens/__tests__/ClientBoard.test.tsx` | Modify | Skip button rendering, confirmation dialog, insufficient funds |
| `src/screens/__tests__/Shop.test.tsx` | Modify | Update item count from 6 to 9 (3 new tools) |
| `src/screens/__tests__/Mission.test.tsx` | Modify | New tool flags for css-reference, enhanced-errors, style-inspector |

## Scope Exclusions

- No changes to level data files (levels 1-8 stay as-is)
- No new levels
- No multiplayer features
- No changes to the existing Solution Preview tool (separate spec)
- No changes to existing tools (Syntax Highlighter+, Bug Detector, Property Hint, Solution Peek, Client Call)
- CSS Reference data covers only properties used in the 8 current levels, not a full CSS reference

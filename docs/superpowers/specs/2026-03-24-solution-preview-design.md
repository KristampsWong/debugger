# Solution Preview Tool — Design Spec

## Summary

Add a "Solution Preview" shop tool ($100, non-consumable) that lets players toggle the LivePreview between their current CSS and the level's correct solution CSS. This gives players a visual reference of the target result without revealing the actual CSS code.

Note: This is distinct from the existing `solution-peek` tool, which is a consumable that reveals the expected CSS *value* for one failing assertion (text). This tool shows the visual *rendering* of the correct result (iframe). The name "Solution Preview" is intentionally different from "Solution Peek" to clarify this distinction in the shop.

## Motivation

Players currently have no way to see what the correct result looks like. They must infer the goal from test descriptions and the client brief alone. A visual preview of the correct answer helps players understand what they're aiming for, reducing frustration while still requiring them to figure out the CSS themselves.

## Design

### Data & Types

- Add `'solution-preview'` to the `ToolId` union type in `src/types/index.ts`
- Add a new entry to `SHOP_ITEMS`:
  - `id`: `'solution-preview'`
  - `name`: `"Solution Preview"`
  - `price`: `100`
  - `consumable`: `false`
  - `description`: something like "Toggle the live preview to see what the correct result looks like"
- No changes to the `Level` type — `solutionCSS` already exists on every level

### Mission Screen Logic

- Add a `previewMode` React state: `'player' | 'solution'`, defaulting to `'player'`
- Derive `hasSolutionPreview` from `ownedTools.includes('solution-preview')`, following the existing tool-flag pattern
- Determine which CSS to pass to LivePreview:
  - `previewMode === 'solution'` → `currentLevel.solutionCSS`
  - `previewMode === 'player'` → `currentCSS` (from levelStore)
- Tests always run against the player's CSS, never the solution CSS. Mission passes a no-op `onIframeReady` callback when `previewMode === 'solution'`, so the iframe load does not trigger test runs. The existing `handleIframeReady` useCallback must include `previewMode` in its dependency array.
- Reset `previewMode` to `'player'` when the level loads, resets, **and in `handleReplay`** (which does not re-trigger the level load useEffect)

### LivePreview & Tab UI

- LivePreview component itself remains unchanged — it receives `html`, `css`, and `onIframeReady` props and renders them. The callback suppression is handled by Mission, not LivePreview.
- A tab bar renders in Mission **above** the LivePreview component, replacing LivePreview's existing "Preview" `<h3>` header when `hasSolutionPreview` is true. When the tool is not owned, the original header remains.
  - Two tabs: "My Result" and "Correct Answer"
  - Active tab has an underline-style indicator
  - Styled with existing CSS custom properties to match the dark theme
  - Tabs are keyboard-accessible (arrow keys to navigate, Enter/Space to activate)
- When `hasSolutionPreview` is false, no tabs appear — LivePreview looks exactly as it does today

### Shop Integration

- The new tool appears in the Shop alongside existing items with no special positioning
- Uses the existing purchase flow: validate funds, deduct money, add to `ownedTools`
- No new shop UI required — `SHOP_ITEMS` array drives rendering

## Approach

**Approach C — LivePreview accepts CSS via prop, Mission owns the toggle state.**

- LivePreview stays a dumb renderer (no tool awareness)
- Mission manages `previewMode` state and tool gating, consistent with how all other tools are handled
- Tab UI lives in Mission (or a thin wrapper around LivePreview)
- No component duplication

This was chosen over:
- **Approach A (tabs inside LivePreview):** Couples tool awareness into a presentation component
- **Approach B (separate SolutionPreview component):** Duplicates iframe rendering logic

## Scope Exclusions

- Does not reveal the actual solution CSS code to the player
- Does not affect test execution or scoring
- Does not add time penalties or usage limits
- No changes to level data files
- Does not fix the pre-existing bug where consumable tools (`solution-peek`) cannot be re-purchased due to the `buyTool` guard in gameStore

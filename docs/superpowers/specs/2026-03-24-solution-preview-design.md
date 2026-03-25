# Solution Preview Tool — Design Spec

## Summary

Add a "Solution Preview" shop tool ($100, non-consumable) that lets players toggle the LivePreview between their current CSS and the level's correct solution CSS. This gives players a visual reference of the target result without revealing the actual CSS code.

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
- Tests always run against the player's CSS, never the solution CSS. When in solution mode, the `onIframeReady` callback should not trigger test runs.
- Reset `previewMode` to `'player'` when the level loads or resets

### LivePreview & Tab UI

- LivePreview component remains unchanged — it receives `html` and `css` props and renders them
- A tab bar renders **above** the LivePreview iframe, visible only when `hasSolutionPreview` is true
  - Two tabs: "My Result" and "Correct Answer"
  - Active tab has an underline-style indicator
  - Styled with existing CSS custom properties to match the dark theme
- When `hasSolutionPreview` is false, no tabs appear — LivePreview looks exactly as it does today
- The `onIframeReady` callback only fires when showing the player's CSS, so tests are not run against the solution

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

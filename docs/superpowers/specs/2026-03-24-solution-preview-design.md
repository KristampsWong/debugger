# Solution Preview Tool — Design Spec

## Summary

Add a "Solution Preview" shop tool ($100, non-consumable) that shows a side-by-side split view of the player's current result and the correct solution rendering. When the tool is owned, a second iframe appears next to the existing LivePreview, labeled "Correct Answer", showing the level's `solutionCSS` applied to the same HTML.

Note: This is distinct from the existing `solution-peek` tool, which is a consumable that reveals the expected CSS *value* for one failing assertion (text). This tool shows the visual *rendering* of the correct result (iframe). The name "Solution Preview" is intentionally different from "Solution Peek" to clarify this distinction in the shop.

## Motivation

Players currently have no way to see what the correct result looks like. They must infer the goal from test descriptions and the client brief alone. A visual preview of the correct answer helps players understand what they're aiming for, reducing frustration while still requiring them to figure out the CSS themselves.

The split-view approach was chosen over a toggle/tab because players need to compare their work against the goal simultaneously. A toggle forces back-and-forth switching, which similar games have identified as a pain point.

## Design

### Data & Types

- Add `'solution-preview'` to the `ToolId` union type in `src/types/index.ts`
- Add a new entry to `SHOP_ITEMS`:
  - `id`: `'solution-preview'`
  - `name`: `"Solution Preview"`
  - `price`: `100`
  - `consumable`: `false`
  - `description`: something like "See the correct result side-by-side with your preview"
- No changes to the `Level` type — `solutionCSS` already exists on every level

### Mission Screen Logic

- Derive `hasSolutionPreview` from `ownedTools.includes('solution-preview')`, following the existing tool-flag pattern
- No `previewMode` state needed — both previews are always visible when the tool is owned
- The existing LivePreview receives the player's `currentCSS` and the `onIframeReady` callback as before — no changes to the existing wiring
- A second LivePreview instance renders beside the first, receiving `solutionCSS` as its `css` prop and a **no-op** `onIframeReady` callback (tests must only run against the player's CSS)
- The preview area layout switches from single to side-by-side (CSS flex/grid) when `hasSolutionPreview` is true

### LivePreview & Split Layout

- LivePreview component remains completely unchanged — it receives `html`, `css`, and `onIframeReady` props and renders them. It is reused as-is for both the player preview and the solution preview.
- When `hasSolutionPreview` is true:
  - The preview area becomes a flex/grid row with two equal-width columns
  - Left column: labeled "My Result", contains the existing LivePreview (player CSS)
  - Right column: labeled "Correct Answer", contains a second LivePreview (solution CSS)
  - Labels are styled as small headers above each iframe, matching the dark theme
- When `hasSolutionPreview` is false:
  - Layout is unchanged — single LivePreview, exactly as today

### Shop Integration

- The new tool appears in the Shop alongside existing items with no special positioning
- Uses the existing purchase flow: validate funds, deduct money, add to `ownedTools`
- No new shop UI required — `SHOP_ITEMS` array drives rendering

## Approach

**Split view with two LivePreview instances — Mission owns the layout.**

- LivePreview stays a dumb renderer (no tool awareness, no changes needed)
- Mission conditionally renders one or two LivePreview instances based on tool ownership
- The solution preview instance gets a no-op callback, so tests are unaffected
- Simple, no toggle state to manage, no callback suppression logic

This was chosen over:
- **Toggle/tab approach:** Players reported that switching back and forth between views is frustrating — can't compare side-by-side
- **Separate SolutionPreview component:** Unnecessary since LivePreview can be reused directly

## Scope Exclusions

- Does not reveal the actual solution CSS code to the player
- Does not affect test execution or scoring
- Does not add time penalties or usage limits
- No changes to level data files
- Does not fix the pre-existing bug where consumable tools (`solution-peek`) cannot be re-purchased due to the `buyTool` guard in gameStore

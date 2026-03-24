# Design: shadcn/ui Migration + Electron Shell for Steam

**Date:** 2026-03-24
**Status:** Approved

## Overview

Migrate the CSS Debugger game from hand-written CSS with custom dark theme to shadcn/ui components with Tailwind CSS v4 and shadcn's default dark theme. Then wrap the app in Electron for Steam desktop publishing.

## Goals

1. Replace all custom CSS components with shadcn/ui equivalents
2. Adopt shadcn's default dark theme (zinc/slate palette)
3. Delete all legacy custom CSS
4. Package as a desktop app via Electron for Steam distribution
5. Maintain all existing game functionality

## Non-Goals

- Steamworks SDK integration (achievements, overlay, cloud saves)
- Custom title bar or system tray
- Auto-updater (Steam handles updates)
- Redesigning game mechanics or adding features

## Pre-Implementation Verification

- Verify `@radix-ui/react-dialog` compatibility with React 19.2 before starting. shadcn's `Dialog` depends on Radix UI primitives. If incompatible, fall back to a custom modal using Tailwind classes instead of the shadcn Dialog component.

---

## Part 1: shadcn/ui Migration

### Dependencies

**New production dependencies:**
- `lucide-react` — icon library used by shadcn

**New dev dependencies:**
- `tailwindcss` v4
- `@tailwindcss/vite` — Vite plugin for Tailwind v4
- `class-variance-authority` — variant styling (shadcn peer dep)
- `clsx` — conditional class merging
- `tailwind-merge` — Tailwind class deduplication

**Installed via shadcn CLI:**
- `npx shadcn@latest init` — scaffolds `components/ui/`, `lib/utils.ts`, CSS variables
- `npx shadcn@latest add button card dialog badge`

### Theme

- Add `class="dark"` to `<html>` in `index.html`
- Use shadcn's default dark theme CSS variables (`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--destructive`, etc.)
- Delete all custom CSS variables from `index.css` (`--bg-dark`, `--bg-panel`, `--accent`, etc.)
- Delete `App.css` entirely (unused Vite template styles)

### Component Migration Map

| File | Current UI | shadcn Replacement |
|---|---|---|
| `MainMenu.tsx` | `.menu-btn` link buttons, centered layout | `Button` (default + ghost variants), `Card` container |
| `ClientBoard.tsx` | `.level-card` divs, `.start-btn`, `.money` span, difficulty stars | `Card`+`CardHeader`/`CardContent`/`CardFooter`, `Button`, `Badge` (success variant for money, warning for difficulty) |
| `Shop.tsx` | `.shop-card` divs, `.buy-btn`, `.owned-label`, `.item-price` | `Card` components, `Button`, `Badge` (outline for owned) |
| `Mission.tsx` | `.submit-btn`, `.timer` span, flex layout | `Button` (success), `Badge` (outline for timer), flex layout stays |
| `TestPanel.tsx` | `.test-item` list with status icons | List with `Badge` for pass/fail/pending status |
| `ClientBrief.tsx` | `.client-brief` div with name/text/hint | Tailwind utility classes only |
| `LivePreview.tsx` | `.live-preview` div + iframe | Tailwind classes on container, iframe unchanged |
| `CodeEditor.tsx` | `.code-editor` wrapper around Monaco | Tailwind classes on wrapper, Monaco unchanged |
| `LevelCompleteModal.tsx` | Custom `.modal-overlay` + `.modal` | shadcn `Dialog` + `DialogContent`/`DialogHeader`/`DialogFooter`, `Button` |

### CSS Cleanup

- All component styles removed from `index.css` **except** `.bug-gutter-icon` — this class is passed to Monaco Editor's `glyphMarginClassName` API and cannot be replaced with Tailwind utilities since Monaco controls that DOM
- `App.css` deleted
- All styling moves to Tailwind utility classes inline in components
- Minimal global reset kept (shadcn provides its own base styles)

### Tailwind v4 Configuration

Tailwind CSS v4 uses CSS-first configuration via `@theme` directives instead of `tailwind.config.js`. shadcn's `init` CLI generates the appropriate CSS with `@theme` blocks for the color tokens. No separate `tailwind.config.ts` file is needed.

---

## Part 2: Electron Shell

### Dependencies

**New dev dependencies:**
- `electron`
- `electron-builder`
- `concurrently` (cross-platform parallel script runner)
- `wait-on` (for dev script coordination)

### File Structure

```
electron/
  main.ts       — Main process: creates BrowserWindow, loads app
  preload.ts    — Empty preload script (placeholder for future Steamworks)
```

### Electron TypeScript Compilation

Electron cannot execute `.ts` files directly. The main process files (`electron/main.ts`, `electron/preload.ts`) must be compiled to JavaScript before Electron can load them. Use `tsc` with a dedicated `tsconfig.electron.json` that outputs to `electron/dist/`. The `"main"` field in `package.json` points to `electron/dist/main.js`.

### Behavior

- **Dev mode:** Electron loads `http://localhost:5173` (Vite dev server)
- **Production:** Electron loads `dist/index.html` via `file://` protocol
- **Window:** ~1200x800 default, resizable, dark background color

### Routing: HashRouter Required

The app must switch from `BrowserRouter` to `HashRouter` in `App.tsx`. `BrowserRouter` relies on the HTML5 History API which does not work with Electron's `file://` protocol in production. `HashRouter` uses `#`-based URLs that work in both browser and Electron contexts.

### Content Security Policy

Add a reasonable CSP meta tag in `index.html` since the app uses `iframe srcdoc` for live preview. The CSP must allow `blob:` and `srcdoc` iframes to continue working in Electron's `file://` context.

### npm Scripts

```json
"electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
"electron:build": "tsc -b && vite build && tsc -p tsconfig.electron.json && electron-builder",
"electron:preview": "vite build && tsc -p tsconfig.electron.json && electron ."
```

### electron-builder Config

- Targets: macOS `.dmg`, Windows `.exe` (NSIS), Linux `.AppImage`
- App ID: `com.debugger.game`
- Files: `dist/**/*`, `electron/dist/**/*`, `package.json`
- No code signing (Steam handles DRM)

---

## Part 3: Build & Config Changes

### `index.html`
- Add `class="dark"` to `<html>` tag

### `vite.config.ts`
- Add `@tailwindcss/vite` plugin
- Add `base: './'` for Electron `file://` compatibility

### `tsconfig.node.json`
- Add `electron/` to includes

### `tsconfig.electron.json` (new)
- Compiles `electron/*.ts` to `electron/dist/*.js`
- Target: ES2023, module: CommonJS (Electron main process uses CJS)

### `package.json`
- Add `"main": "electron/dist/main.js"` for Electron entry point
- Add electron scripts
- Add electron-builder build config

### `App.tsx`
- Switch `BrowserRouter` to `HashRouter` for Electron `file://` compatibility

### Test Migration Plan

The shadcn migration breaks all tests that query by BEM class names. The scope is significant:

**Unit tests (Vitest + Testing Library):**
- `ClientBoard.test.tsx`: ~15 selectors (`.level-card`, `.money`, `.start-btn`, `.locked-label`, `.difficulty`, `.payout`)
- `Mission.test.tsx`: ~5 selectors (`.test-panel`, `.client-brief`)
- `TestPanel.test.tsx`: `toHaveClass('passed')`, `toHaveClass('failed')` assertions
- `ClientBrief.test.tsx`: `.hint-text` selector
- `Shop.test.tsx`: class-based selectors throughout
- `MainMenu.test.tsx`: `.menu-btn`, `.subtitle` selectors

**Playwright e2e tests (5 spec files, 100+ selectors total):**
- `main-menu.spec.ts`, `client-board.spec.ts`, `mission.spec.ts`, `shop.spec.ts`, `full-flow.spec.ts`

**Strategy:** Add `data-testid` attributes to key elements for stable test selectors. Use `getByRole`/`getByText` where semantic queries suffice. Use `data-testid` for structural queries (e.g., finding a specific level card). Update Playwright selectors to match.

### Files Deleted
- `src/App.css`
- All custom component/screen styles from `src/index.css`

---

## Implementation Order

1. Verify Radix UI + React 19.2 compatibility
2. Install Tailwind v4 + shadcn/ui, configure theme
3. Migrate components/screens to shadcn (one screen at a time):
   - 3a. MainMenu (simplest, validates setup)
   - 3b. ClientBoard + level cards
   - 3c. Shop
   - 3d. Mission + CodeEditor + LivePreview + TestPanel + ClientBrief
   - 3e. LevelCompleteModal → shadcn Dialog
4. Delete legacy CSS (keep `.bug-gutter-icon`)
5. Switch `BrowserRouter` to `HashRouter`
6. Update unit tests (add `data-testid`, switch to role/text queries)
7. Update Playwright e2e tests
8. Add Electron shell (`electron/main.ts`, `electron/preload.ts`, `tsconfig.electron.json`)
9. Configure electron-builder + npm scripts
10. Add CSP meta tag to `index.html`
11. Verify dev mode and production build in Electron

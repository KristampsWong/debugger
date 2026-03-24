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
- `npx shadcn@latest add button card dialog badge separator tooltip`

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

- All component styles removed from `index.css`
- `App.css` deleted
- All styling moves to Tailwind utility classes inline in components
- Minimal global reset kept (shadcn provides its own base styles)

---

## Part 2: Electron Shell

### Dependencies

**New dev dependencies:**
- `electron`
- `electron-builder`
- `wait-on` (for dev script coordination)

### File Structure

```
electron/
  main.ts       — Main process: creates BrowserWindow, loads app
  preload.ts    — Empty preload script (placeholder for future Steamworks)
```

### Behavior

- **Dev mode:** Electron loads `http://localhost:5173` (Vite dev server)
- **Production:** Electron loads `dist/index.html` via `file://` protocol
- **Window:** ~1200x800 default, resizable, dark background color

### npm Scripts

```json
"electron:dev": "vite & wait-on http://localhost:5173 && electron .",
"electron:build": "tsc -b && vite build && electron-builder",
"electron:preview": "vite build && electron ."
```

### electron-builder Config

- Targets: macOS `.dmg`, Windows `.exe` (NSIS), Linux `.AppImage`
- App ID: `com.debugger.game`
- Files: `dist/**/*`, `electron/**/*`
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

### `package.json`
- Add `"main": "electron/main.js"` for Electron entry point
- Add electron scripts
- Add electron-builder build config

### Test Updates
- Unit tests querying by BEM class names (`.level-card`, `.test-item`, etc.) will break
- Update test selectors to use `getByRole`/`getByText` queries (better practice)
- Playwright e2e test selectors need corresponding updates

### Files Deleted
- `src/App.css`
- All custom component/screen styles from `src/index.css`

---

## Implementation Order

1. Install Tailwind v4 + shadcn/ui, configure theme
2. Migrate all components/screens to shadcn (all at once)
3. Delete legacy CSS
4. Update unit tests and e2e tests for new selectors
5. Add Electron shell (`electron/main.ts`, `electron/preload.ts`)
6. Configure electron-builder
7. Verify dev mode and production build in Electron

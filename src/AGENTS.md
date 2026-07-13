<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# src

## Purpose
Application source for Arcane Shell. Organized by the layering `CLAUDE.md` mandates: pure game logic (`game/`) is separate from state (`stores/`), which is separate from UI (`components/`), bridged by `hooks/`. `App.tsx` is the single composition root; `main.tsx` is the Vite/React entry point.

## Key Files
| File | Description |
|------|-------------|
| `main.tsx` | ReactDOM root render, wraps `App` in `StrictMode` |
| `App.tsx` | Shell layout composition root; starts/stops the game loop and computes offline progress in `useEffect` (the only two side effects here — CLAUDE.md §1-4) |
| `index.css` | Global styles (terminal/CLI aesthetic, CSS variables for element/grade colors referenced by `components/common/`) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `game/` | Pure game logic: formulas, tick loop, data, script sandbox (see `game/AGENTS.md`) |
| `stores/` | Zustand stores, one per domain (see `stores/AGENTS.md`) |
| `components/` | React UI components (see `components/AGENTS.md`) |
| `hooks/` | Custom hooks bridging stores → components (see `hooks/AGENTS.md`) |
| `types/` | Shared TypeScript types (see `types/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Follow the layering strictly: components never import stores directly for reads that a hook could provide; game logic never imports React; stores never contain UI state (`useUIStore` is separate from game-state stores).
- The tick loop (`game/loop/gameLoop.ts`) is started/stopped from `App.tsx`'s effect, but the loop itself lives outside React entirely — don't move tick logic into a component.
- Anything rendered as a number should go through `game/formulas/formatNumber.ts`, and anything sized to be "big" should be typed as `BigNum` (`types/BigNum.ts`), even though both are `number`-backed today (Milestone 1).

### Testing Requirements
- `npm test` (Vitest). Store/engine logic tests live alongside their subject in `game/` (`*.test.ts`); there are currently no component-level tests.

### Common Patterns
- Every domain has: a store (`stores/useXStore.ts`) → a hook (`hooks/useX.ts`) wrapping selectors → components that call only the hook.
- Korean UI strings and comments citing doc sections (e.g. `ui_spec §3-13`) are the norm — preserve that citation style when adding features so behavior stays traceable to `docs/`.

## Dependencies

### Internal
- `docs/` is the numeric/behavioral source of truth referenced throughout.

### External
- React 18, zustand 4, react-router-dom 6, js-interpreter (see root `AGENTS.md` for the full list).

<!-- MANUAL: -->

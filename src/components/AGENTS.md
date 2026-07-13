<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# components

## Purpose
React UI components. Per CLAUDE.md §1-1, components only decide "what to draw" — all calculation (damage formulas, cost curves, view-model shaping) happens in `src/game/` or `src/hooks/` and is imported here. Layout follows `docs/arcane_shell_ui_spec.md` §1: fixed top bar / [terminal ≥60% width | side-panel tabs] / command input.

## Key Files
| File | Description |
|------|-------------|
| `TopBar.tsx` | Always-visible mana gauge (ASCII bar + fill bar) + mana-stone counts + gold/fame. Leaf-level subscription only — mana ticks every frame, so this is deliberately kept as one of only two components re-rendering on that cadence (the other being the combat log). |
| `SidePanel.tsx` | Tab bar + tab content switcher. Owns the `TABS` config (id/label/locked) and dispatches locked-tab clicks to `useUIStore.showLockedNotice`. |
| `CommandInput.tsx` | Terminal-style command line (`spell`, `target`, `target set`, `help`) with Tab-autocomplete and ↑/↓ history, per `ui_spec` §4 ("every side-panel action must also be reachable as a typed command") |
| `TreeView.tsx` | Arcana Tree tab: flat per-depth list (graph layout intentionally deferred — see comment), depths 1-10 functional, 11-55 shown locked |
| `ScriptView.tsx` | Script editor tab: textarea + run/stop wired through `useScriptActions`, capped console output, cross-tab "insert from docs" effect |
| `TopBar.tsx`, others | (see `combat/`, `common/`, `panels/` subdirectories for the rest) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `combat/` | Combat-specific leaf components: target, skill bar, stats, log (see `combat/AGENTS.md`) |
| `common/` | Small shared presentational components (element/grade badges) (see `common/AGENTS.md`) |
| `panels/` | Side-panel tab content for read-only/reference screens (docs, help, monster dex) (see `panels/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- No class components (CLAUDE.md §1-1/§4). Keep files under ~200 lines; split into a subcomponent or hook if a file grows past that.
- Never subscribe to a store directly with `useXStore()` (whole-store) — always go through a hook in `src/hooks/` that returns a selected/derived slice, ideally via `useShallow` for multi-field reads.
- Frequently-ticking subscriptions (mana, HP, buffs/cooldowns) should live on leaf components (e.g. `TopBar`, `combat/TargetPanel`) so re-renders stay scoped — don't lift them into a parent that re-renders a large subtree.
- `useEffect` is reserved for external-system sync (DOM scroll-to-bottom, keydown listeners, starting/stopping the game loop or script worker) — never for deriving state from props/store (CLAUDE.md §1-4). Use `useMemo` or a hook selector instead.
- All game-balance numbers displayed here must come from `game/formulas/` or a hook — no inline hardcoded multipliers/costs (CLAUDE.md §4).

### Testing Requirements
- No component tests currently exist in this repo; verify UI changes by running `npm run dev` and exercising the affected tab/panel manually (note: the script sandbox requires the COOP/COEP headers `vite.config.ts` sets, so `SharedArrayBuffer`-dependent features only work through the dev/preview server, not a bare static server).

### Common Patterns
- Korean UI strings throughout, often with a `ui_spec §N-M` comment citation — keep that citation style for new panels/screens so behavior stays traceable to the design doc.
- Locked/future features render with a 🔒 and call `useUIStore.showLockedNotice` rather than being hidden — keeps the full nav visible per the design.

## Dependencies

### Internal
- `../hooks/`, `../stores/useUIStore.ts` (UI state only), `../game/formulas/formatNumber.ts`, `../game/combatEngine.ts` (manual cast entry point), `../game/data/`

### External
- React 18 (function components + hooks only)

<!-- MANUAL: -->

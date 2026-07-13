<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# stores

## Purpose
Zustand stores, split by domain per `CLAUDE.md` §2-1 — never one giant store. Each store owns exactly one concern; derived/computed values are exported as free selector functions next to the store rather than stored as state.

## Key Files
| File | Description |
|------|-------------|
| `usePlayerStore.ts` | Core stats, mana, resources (gold/fame/mana stones), rank/grade, `lastSeen`. Persisted via `zustand/middleware` `persist` with a debounced `localStorage` adapter. Also exports `debouncedLocalStorage()` (shared by other persisted stores) and derived selectors `selectMaxMana`, `selectManaRegenPerSec`. |
| `useCombatStore.ts` | Current target, ring-buffered combat log (`COMBAT_LOG_MAX` = 200 entries, oldest dropped), active buffs, cooldowns. Transient — not persisted; the tick loop mutates timers here. |
| `useTreeStore.ts` | Arcana Tree node levels (`buyNode`), keyed by depth. Persisted. Reaches into `usePlayerStore` directly to spend mana stones and apply stat deltas on purchase. |
| `useScriptStore.ts` | User script source (persisted), running flag, capped console output (200 lines), memory usage. Ships a default auto-hunt script as `DEFAULT_SCRIPT`. |
| `useUIStore.ts` | UI-only state: active side-panel tab, "locked feature" toast, cross-tab docs-insert request. **Not persisted, never mixed with game state** (CLAUDE.md §2-1). |

## For AI Agents

### Working In This Directory
- New game-state domains get their own store here, not a field bolted onto an existing one.
- UI-only state (modal open, selected tab, transient toasts) belongs in `useUIStore.ts` or local component `useState` — never in a persisted game store.
- Persisted stores must use `debouncedLocalStorage(PERSIST_DEBOUNCE_MS)` from `usePlayerStore.ts` (or a similar debounced adapter) — never write to `localStorage` per tick (CLAUDE.md §2-4). `partialize` should whitelist exactly the fields that need saving (exclude transient runtime fields).
- Derived/computed values (max mana, tree stat bonus, etc.) are exported as plain functions taking the store's state shape (e.g. `selectMaxMana(s: PlayerState)`), not stored as state — call them from a hook in `src/hooks/`, not from components directly.
- Cross-store writes (e.g. `useTreeStore.buyNode` spending from `usePlayerStore`) call `.getState()` on the other store rather than subscribing to it.

### Testing Requirements
- Exercised indirectly via `src/game/integration.test.ts`, which drives real store instances through `combatEngine` and `useTreeStore.buyNode`. Reset state explicitly with `.setState()` in `beforeEach` when adding tests that mutate persisted stores.

### Common Patterns
- Ring-buffer pattern for any accumulating list (`useCombatStore.log`, `useScriptStore.consoleOutput`) — cap and drop-oldest, never unbounded push (CLAUDE.md §1-3).
- Action naming: verbs on the state shape itself (`setMana`, `addManaStones`, `buyNode`), no separate "actions" module.

## Dependencies

### Internal
- `../game/constants.ts` (tick cadence, debounce ms, caps), `../game/data/` (spawn/lookup data), `../game/formulas/` (cost/gain calculations), `../types/` (state shape types)

### External
- `zustand`, `zustand/middleware` (`persist`), `zustand/react/shallow` (`useShallow`, used by consuming hooks, not stores themselves)

<!-- MANUAL: -->

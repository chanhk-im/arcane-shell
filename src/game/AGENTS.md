<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# game

## Purpose
All pure/engine-side game logic, deliberately kept free of React. This is where combat resolution, the tick loop, static data, and the script sandbox live. Components and stores call into this layer; this layer never imports from `components/`.

## Key Files
| File | Description |
|------|-------------|
| `combatEngine.ts` | `performCast()` — the single orchestration point for casting a skill (manual UI or script), shared by both entry paths. Reads/writes stores, rolls RNG, throws typed `ScriptError` for the 3 catchable cases. `manualCast()` wraps it for UI buttons (catches and logs instead of throwing). |
| `constants.ts` | Tunable engine constants: tick cadence, Milestone-1 placeholder base stats, persistence debounce, script sandbox limits (step budget, busy-time, hard-kill timeout) |
| `targeting.ts` | Target selection + `TargetInfo` projection shared by the script bridge and UI (`toTargetInfo`, `applySelector`) |
| `helpContent.ts` | In-game help text (`help <keyword>` command + Help panel) — every number here is transcribed from `formulas/combat.ts` / `formulas/manaUptime.ts` so it can't silently drift from the real formulas |
| `integration.test.ts` | End-to-end test exercising store + combatEngine + tree store together through real runtime modules (jsdom environment) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `formulas/` | Pure calculation functions, 1:1 with the balance docs (see `formulas/AGENTS.md`) |
| `data/` | Static game data (monsters, skills, tree nodes) (see `data/AGENTS.md`) |
| `loop/` | Independent tick loop + offline-progress calculation (see `loop/AGENTS.md`) |
| `script/` | User script sandbox: Worker host, whitelist API, wire protocol (see `script/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Keep this layer store-aware but React-free — files here call `useXStore.getState()` directly (not the hook form), since hooks are a React-only concern that belongs in `src/hooks/`.
- `combatEngine.ts` is the only place that should call `resolveDamage` and mutate combat state for a cast — don't duplicate cast logic elsewhere (e.g. in the script dispatch table); route script casts through `performCast` too (see `script/scriptHost.ts`'s `dispatch('cast', ...)`).
- When a cast fails in a way a script should be able to `try/catch`, throw via `makeScriptError` (typed, has `.type`); anything else (e.g. unknown skill id) should be a plain `Error`, which is intentionally fatal to a running script.

### Testing Requirements
- `formulas.test.ts` (in `formulas/`) tests pure math; `integration.test.ts` (here) exercises the full cast/kill/tree-purchase flow through real stores; `script/sandbox.test.ts` tests the interpreter sandbox semantics directly. Run via `npm test`.

### Common Patterns
- Every formula/constant traces to a doc citation in a comment (`// stats_summary.md §1`, `// master_spec.md §2-4`). Preserve this when adding new formulas.

## Dependencies

### Internal
- `../stores/` (reads/writes via `getState()`), `../types/` (shared types), `docs/` (numeric source of truth)

### External
- None beyond the app-wide dependencies (zustand for store access types).

<!-- MANUAL: -->

<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# loop

## Purpose
The independent tick loop and offline-progress calculation — deliberately **outside** React (CLAUDE.md §1-4: the tick loop is a store-external module, not a component `useEffect`). `App.tsx` only starts/stops it and reflects results.

## Key Files
| File | Description |
|------|-------------|
| `gameLoop.ts` | `startGameLoop()` / `stopGameLoop()` — a plain `setInterval` at `TICK_MS` (100ms / 10 ticks-per-sec, from `game/constants.ts`) that regenerates mana (clamped to max), counts down buff/cooldown timers via `useCombatStore.tickTimers`, and respawns the target if it somehow became null. Guards against double-start. |
| `offline.ts` | `computeOfflineProgress(now?)` / `applyOfflineProgress(summary)` — estimates DPS against the selected tier using the same formulas as live combat, projects kills/mana-stones for the elapsed offline time (70% of online rate, 24h cap — `master_spec.md` §8-6), and is computed **once on load** from the persisted `lastSeen` timestamp, never per tick (CLAUDE.md §2-4). |

## For AI Agents

### Working In This Directory
- Do not move tick logic into a component `useEffect` — `gameLoop.ts` must stay a store-external module that components only start/stop.
- `offline.ts`'s `estimateDps` intentionally reuses the exact formulas from `game/formulas/combat.ts` and `game/formulas/manaUptime.ts` (not a separate approximation) so online and offline math can't drift apart — keep it that way when either changes.
- `BASE_CASTS_PER_SEC` in `offline.ts` is flagged as a placeholder (neither design doc pins an absolute cast rate) — treat changing it as a balance decision, not a bug fix, and update the inline comment if the docs are later updated to specify one.

### Testing Requirements
- Exercised indirectly via `game/integration.test.ts` for tick-driven state (buffs/cooldowns, combat log cap). No dedicated test file for `offline.ts`/`gameLoop.ts` currently — if adding one, inject `now` into `computeOfflineProgress` (already a parameter) rather than mocking `Date.now()` globally.

### Common Patterns
- Both modules read authoritative state via `useXStore.getState()` (not hooks) and write back the same way, consistent with the rest of `src/game/`.

## Dependencies

### Internal
- `../../stores/usePlayerStore.ts`, `../../stores/useCombatStore.ts`, `../data/monsters.ts`, `../formulas/combat.ts`, `../formulas/manaUptime.ts`, `../data/skills.ts` (`GRADE1_COEFFICIENT`), `../constants.ts`

### External
- None

<!-- MANUAL: -->

// Game-wide tunable constants. Balance values live in formulas/ or the .xlsx
// data; this file holds engine cadence + Milestone-1 placeholder values that
// the design docs do not pin down (flagged inline).

import type { CoreStats } from '../types/PlayerStats';

// Tick loop cadence.
export const TICK_MS = 100; // 10 ticks/sec
export const TICKS_PER_SEC = 1000 / TICK_MS;

// Starting core stats (Rank 0). PLACEHOLDER — docs give rank-1 *totals* (~21 tree
// stat) but no explicit rank-0 baseline; these make the slice immediately
// playable and are added to by tree purchases.
export const BASE_STATS: CoreStats = {
  spellPower: 10,
  agility: 10,
  manaPool: 100,
  manaRegen: 20,
  intelligence: 10,
};

// Mana model (stats_summary.md §5). maxMana / regen derive from stats.
export function maxManaFrom(manaPool: number, intMultiplier: number): number {
  return manaPool * intMultiplier;
}
export function manaRegenPerSecFrom(manaRegen: number, intMultiplier: number): number {
  return manaRegen * intMultiplier;
}

// Persistence.
export const PERSIST_DEBOUNCE_MS = 7000; // CLAUDE.md §2-4: debounce 5-10s
export const OFFLINE_RATE = 0.7; // master_spec.md §8-6: 70% of online
export const OFFLINE_CAP_HOURS = 24; // master_spec.md §8-6: 24h cap

// Combat log ring buffer cap (CLAUDE.md §1-3).
export const COMBAT_LOG_MAX = 200;

// Script sandbox limits. PLACEHOLDER values — neither doc specifies exact
// numbers (flagged to tune later). Semantics:
//  - RUNAWAY_STEP_BUDGET: max interpreter steps executed WITHOUT an intervening
//    sleep() before the script is force-terminated (kills no-sleep infinite
//    loops). A well-behaved loop that sleeps each iteration resets this.
//  - RUNAWAY_BUSY_MS: secondary guard — max continuous busy time (excluding
//    sleep) before force-termination.
//  - STEPS_PER_MACROTASK: how many steps the worker runs before yielding to its
//    own event loop (so a 'stop' message can land promptly).
//  - HARD_KILL_MS: main-thread watchdog — if the worker doesn't acknowledge a
//    stop within this window, terminate() and recreate it (ultimate kill).
export const SCRIPT_RUNAWAY_STEP_BUDGET = 200_000;
export const SCRIPT_RUNAWAY_BUSY_MS = 2000;
export const SCRIPT_STEPS_PER_MACROTASK = 2000;
export const SCRIPT_HARD_KILL_MS = 500;
export const SCRIPT_MEMORY_MAX = 64; // stub memory capacity (system.memoryMax)
export const SCRIPT_MEMORY_PER_RUN = 8; // stub memory a single running script uses

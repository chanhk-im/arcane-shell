// Independent tick loop (NOT a component useEffect) — CLAUDE.md §1-4.
// Drives mana regen, buff/cooldown countdown, and dead-target respawn. Stores
// only reflect results. Combat casts themselves happen in combatEngine (manual
// clicks or the script worker); this loop is the passive world clock.

import { usePlayerStore, selectMaxMana, selectManaRegenPerSec } from '../../stores/usePlayerStore';
import { useCombatStore } from '../../stores/useCombatStore';
import { spawnMonster } from '../data/monsters';
import { TICK_MS } from '../constants';

let handle: ReturnType<typeof setInterval> | null = null;

function tick(): void {
  const dtSec = TICK_MS / 1000;

  // Mana regen (stats_summary.md §5): clamp to max.
  const player = usePlayerStore.getState();
  const maxMana = selectMaxMana(player);
  const regen = selectManaRegenPerSec(player);
  const nextMana = Math.min(maxMana, player.mana + regen * dtSec);
  if (nextMana !== player.mana) player.setMana(nextMana);

  // Buff/cooldown countdown.
  useCombatStore.getState().tickTimers(dtSec);

  // Safety: if the target somehow became null, respawn the selected tier.
  const combat = useCombatStore.getState();
  if (!combat.target) combat.setTarget(spawnMonster(combat.selectedTier));
}

export function startGameLoop(): void {
  if (handle !== null) return; // already running (guard double-start)
  handle = setInterval(tick, TICK_MS);
}

export function stopGameLoop(): void {
  if (handle !== null) {
    clearInterval(handle);
    handle = null;
  }
}

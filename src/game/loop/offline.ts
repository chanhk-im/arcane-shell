// Offline progress (master_spec.md §8-6): assume the last active script kept
// running at 70% of online rate, capped at 24h. Computed ONCE on load from the
// persisted lastSeen timestamp — never per tick (CLAUDE.md §2-4).

import { usePlayerStore } from '../../stores/usePlayerStore';
import { useCombatStore } from '../../stores/useCombatStore';
import { getMonster } from '../data/monsters';
import {
  hitChance,
  critChance,
  atkSpeedMult,
  intMult,
  defenseMitigation,
} from '../formulas/combat';
import { manaUptime } from '../formulas/manaUptime';
import { GRADE1_COEFFICIENT } from '../data/skills';
import { DEFAULT_DERIVED } from '../../types/PlayerStats';
import { OFFLINE_RATE, OFFLINE_CAP_HOURS } from '../constants';

// PLACEHOLDER cadence: assume a base of 2 cast attempts/sec scaled by attack
// speed and gated by mana uptime. Neither doc pins an absolute cast rate.
const BASE_CASTS_PER_SEC = 2;

export interface OfflineSummary {
  seconds: number; // elapsed (capped) seconds credited
  cappedTo24h: boolean;
  kills: number;
  manaStones: number;
  grade: number;
}

// Rough online DPS estimate against the selected tier's monster.
function estimateDps(tier: number): { dps: number; killsPerSec: number } {
  const player = usePlayerStore.getState();
  const s = player.coreStats;
  const monster = getMonster(tier);
  if (!monster) return { dps: 0, killsPerSec: 0 };

  const perHit =
    s.spellPower *
    intMult(s.intelligence) *
    GRADE1_COEFFICIENT *
    defenseMitigation(monster.defense, DEFAULT_DERIVED.armorPen);
  const critMult = 1 + critChance(s.agility) * (DEFAULT_DERIVED.critDamage / 100 - 1);
  const expectedHitDmg = perHit * hitChance(s.agility) * critMult;

  const castsPerSec = BASE_CASTS_PER_SEC * atkSpeedMult(s.agility) * manaUptime(s.agility);
  const dps = expectedHitDmg * castsPerSec;
  const killsPerSec = monster.hp > 0 ? dps / monster.hp : 0;
  return { dps, killsPerSec };
}

export function computeOfflineProgress(now = Date.now()): OfflineSummary | null {
  const player = usePlayerStore.getState();
  const elapsedMs = now - player.lastSeen;
  if (elapsedMs < 60_000) return null; // ignore < 1 min

  const capMs = OFFLINE_CAP_HOURS * 3600 * 1000;
  const cappedTo24h = elapsedMs > capMs;
  const seconds = Math.min(elapsedMs, capMs) / 1000;

  const tier = useCombatStore.getState().selectedTier;
  const monster = getMonster(tier);
  if (!monster) return null;

  const { killsPerSec } = estimateDps(tier);
  const kills = Math.floor(killsPerSec * seconds * OFFLINE_RATE);
  if (kills <= 0) {
    return { seconds, cappedTo24h, kills: 0, manaStones: 0, grade: monster.manaStoneGrade };
  }

  const avgDrop = (monster.dropMin + monster.dropMax) / 2;
  const manaStones = Math.floor(kills * avgDrop);
  return { seconds, cappedTo24h, kills, manaStones, grade: monster.manaStoneGrade };
}

// Apply the summary to the store (award stones) and refresh lastSeen.
export function applyOfflineProgress(summary: OfflineSummary): void {
  const player = usePlayerStore.getState();
  if (summary.manaStones > 0) player.addManaStones(summary.grade, summary.manaStones);
  player.touchLastSeen();
}

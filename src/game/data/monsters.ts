// Monster data accessor. Static per-tier stats come from monsters.json
// (parsed from arcane_shell_monster_stats.xlsx by scripts/extract-xlsx.mjs).

import monstersJson from './monsters.json';
import type { MonsterData, MonsterInstance } from '../../types/Monster';

export const MONSTERS = monstersJson as MonsterData[];

const BY_TIER = new Map<number, MonsterData>(MONSTERS.map((m) => [m.tier, m]));

export function getMonster(tier: number): MonsterData | undefined {
  return BY_TIER.get(tier);
}

// Highest tier accessible this milestone (grade-1 monsters, tiers 1-5).
export const MAX_TIER_MILESTONE_1 = 5;

// Create a fresh live instance of a tier's monster at full HP.
export function spawnMonster(tier: number): MonsterInstance | null {
  const data = BY_TIER.get(tier);
  if (!data) return null;
  return {
    tier: data.tier,
    isBoss: data.isBoss,
    element: data.element,
    maxHp: data.hp,
    currentHp: data.hp,
    defense: data.defense,
    manaStoneGrade: data.manaStoneGrade,
    dropMin: data.dropMin,
    dropMax: data.dropMax,
  };
}

// Deterministic drop count in [min, max] (master_spec.md §2-2: no probability
// roll). We pick the midpoint so results are reproducible for the slice.
export function rollDrop(instance: MonsterInstance): number {
  return Math.round((instance.dropMin + instance.dropMax) / 2);
}

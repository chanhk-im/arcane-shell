// Target selection + TargetInfo projection, shared by the script bridge and UI.
// This milestone has a single live monster (the current target), so selectors
// operate on it; the shape is future-proof for multi-monster rift hunting.

import { useCombatStore } from '../stores/useCombatStore';
import type { MonsterInstance } from '../types/Monster';
import type { TargetInfo } from '../types/ScriptTypes';
import { spawnMonster, MAX_TIER_MILESTONE_1 } from './data/monsters';

export function toTargetInfo(m: MonsterInstance): TargetInfo {
  return {
    tier: m.tier,
    isBoss: m.isBoss,
    element: m.element,
    hpPercent: m.maxHp > 0 ? (m.currentHp / m.maxHp) * 100 : 0,
    defense: m.defense,
    manaStoneGrade: m.manaStoneGrade as 1 | 2 | 3 | 4 | 5,
  };
}

export function currentTargetInfo(): TargetInfo | null {
  const t = useCombatStore.getState().target;
  return t ? toTargetInfo(t) : null;
}

export function listTargets(count: number): TargetInfo[] {
  const t = useCombatStore.getState().target;
  if (!t) return [];
  // Only one live monster this milestone; honor `count` bound anyway.
  return count >= 1 ? [toTargetInfo(t)] : [];
}

// target.set(selector) — returns success. With a single monster most selectors
// resolve to (re)spawning the selected tier's monster.
export function applySelector(selector: string): boolean {
  const combat = useCombatStore.getState();
  if (selector === 'boss') {
    // A boss only exists on grade boundary tiers (5/10/... ); tier 5 in scope.
    const bossTier = MAX_TIER_MILESTONE_1; // tier 5 = grade-1 boss
    if (combat.selectedTier !== bossTier) return false;
    if (!combat.target) combat.setTarget(spawnMonster(bossTier));
    return combat.target?.isBoss ?? false;
  }
  // "nearest" / "weakest" / "element:*" all resolve to the one live monster.
  if (!combat.target) {
    combat.setTarget(spawnMonster(combat.selectedTier));
  }
  return combat.target != null;
}

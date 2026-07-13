import type { Element } from './Element';
import type { BigNum } from './BigNum';

// Static per-tier monster data parsed from arcane_shell_monster_stats.xlsx
// (see scripts/extract-xlsx.mjs -> src/game/data/monsters.json).
export interface MonsterData {
  tier: number; // 1..22
  section: string; // 초반/중반/후반/엔드
  isBoss: boolean;
  element: Element;
  baseHp: BigNum; // normal-monster HP for this tier
  baseDefense: number;
  hp: BigNum; // effective HP (boss tiers = 5x base)
  defense: number; // effective defense (boss tiers = 2x base)
  manaStoneGrade: number; // 1..5
  gradeStartTier: number;
  gradeEndTier: number;
  dropMin: number; // mana-stone drop range [min, max], no probability roll
  dropMax: number;
}

// A live monster currently being fought. Store only reflects this.
export interface MonsterInstance {
  tier: number;
  isBoss: boolean;
  element: Element;
  maxHp: BigNum;
  currentHp: BigNum;
  defense: number;
  manaStoneGrade: number;
  dropMin: number;
  dropMax: number;
}

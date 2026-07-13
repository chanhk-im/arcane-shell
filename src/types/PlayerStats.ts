import type { BigNum } from './BigNum';

// Five core stats per stats_summary.md §1.
// 주문력 spellPower, 민첩 agility, 마나 mana(pool), 마나회복 manaRegen, 지능 intelligence.
export interface CoreStats {
  spellPower: BigNum; // 주문력 — direct multiplier on per-hit damage
  agility: BigNum; // 민첩 — hit / crit / attack-speed
  manaPool: BigNum; // 마나 — max mana size
  manaRegen: BigNum; // 마나회복 — regen rate stat
  intelligence: BigNum; // 지능 — amplifies spellPower/mana/manaRegen
}

export type CoreStatKey = keyof CoreStats;

export const CORE_STAT_KEYS: readonly CoreStatKey[] = [
  'spellPower',
  'agility',
  'manaPool',
  'manaRegen',
  'intelligence',
];

export const CORE_STAT_LABEL: Record<CoreStatKey, string> = {
  spellPower: '주문력',
  agility: '민첩',
  manaPool: '마나',
  manaRegen: '마나회복',
  intelligence: '지능',
};

// Derived stats that have no tree node (rune-only, Rank 6+) per stats_summary.md §2.
// Included as fields with defaults so combat formulas can consume them uniformly.
export interface DerivedStats {
  critDamage: number; // 크리티컬 피해 — default 150%
  armorPen: number; // 방어 관통 — default 0
}

export const DEFAULT_DERIVED: DerivedStats = {
  critDamage: 150,
  armorPen: 0,
};

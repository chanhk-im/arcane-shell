// Combat formulas — 1:1 with arcane_shell_stats_summary.md §1 and
// arcane_shell_master_spec.md §2. Pure functions only (CLAUDE.md §1-1/§2-3).
// Balance source of truth: the .xlsx package; constants below are transcribed
// from stats_summary.md §1 and cross-checked against master_spec.md §2.

import type { Element } from '../../types/Element';

// 지능배율 = 1 + 지능/100 (uncapped — late-game exponential growth driver).
export function intMult(intelligence: number): number {
  return 1 + intelligence / 100;
}

// 명중률 = 90% + 9%×(민첩/(민첩+200)), converges to 99%.
export function hitChance(agility: number): number {
  return 0.9 + 0.09 * (agility / (agility + 200));
}

// 크리확률 = 5% + 75%×(민첩/(민첩+300)), converges to 80%.
export function critChance(agility: number): number {
  return 0.05 + 0.75 * (agility / (agility + 300));
}

// 공격속도배율 = 1 + 2×(민첩/(민첩+400)), converges to 3x.
export function atkSpeedMult(agility: number): number {
  return 1 + 2 * (agility / (agility + 400));
}

// 방어감쇠 = 100/(100+방어력-방어관통) (master_spec.md §2-4).
// Clamped so armorPen ≥ defense cannot exceed 100% or divide by <=0.
export function defenseMitigation(defense: number, armorPen: number): number {
  const effective = Math.max(0, defense - armorPen);
  return 100 / (100 + effective);
}

// 속성 상성 (master_spec.md §2-3):
//  4-cycle 화→수→뇌→지→화: winner +25%, loser -25%.
//  opposed 성↔암: attacking the opposed element always +25% (both directions).
//  everything else neutral (1.0).
const CYCLE_NEXT: Partial<Record<Element, Element>> = {
  화: '수',
  수: '뇌',
  뇌: '지',
  지: '화',
};

export function elementalModifier(attacker: Element, defender: Element): number {
  if (CYCLE_NEXT[attacker] === defender) return 1.25; // attacker beats defender
  if (CYCLE_NEXT[defender] === attacker) return 0.75; // defender beats attacker
  if (
    (attacker === '성' && defender === '암') ||
    (attacker === '암' && defender === '성')
  ) {
    return 1.25;
  }
  return 1.0;
}

// Full per-cast damage resolution following master_spec.md §2-4 order:
//   명중 → 크리 → 데미지(주문력×지능배율×스킬계수×크리피해) → 방어감쇠 → 속성보정.
// hitRoll/critRoll are injected (0..1) so the function stays pure and testable.
export interface DamageInputs {
  spellPower: number; // final 주문력 (before int amplification)
  intelligence: number;
  agility: number;
  skillCoefficient: number;
  critDamage: number; // % (default 150)
  armorPen: number;
  attackerElement: Element;
  defenderElement: Element;
  defenderDefense: number;
  hitCount: number; // GPU expected-hits (1 this milestone)
  focusCritBonus?: number; // 집중 buff: +0.20 crit chance
  overloadSpellPowerPct?: number; // 과부하 buff: +0.50 spell power
}

export interface DamageResult {
  hit: boolean;
  crit: boolean;
  hitCount: number;
  damage: number;
}

export function resolveDamage(
  input: DamageInputs,
  hitRoll: number,
  critRoll: number,
): DamageResult {
  const hit = hitRoll <= hitChance(input.agility);
  if (!hit) {
    return { hit: false, crit: false, hitCount: 0, damage: 0 };
  }
  const critThreshold = Math.min(
    0.8,
    critChance(input.agility) + (input.focusCritBonus ?? 0),
  );
  const crit = critRoll <= critThreshold;

  const spBase = input.spellPower * (1 + (input.overloadSpellPowerPct ?? 0));
  let dmg = spBase * intMult(input.intelligence) * input.skillCoefficient;
  if (crit) dmg *= input.critDamage / 100;
  dmg *= defenseMitigation(input.defenderDefense, input.armorPen);
  dmg *= elementalModifier(input.attackerElement, input.defenderElement);

  const hits = Math.max(1, Math.round(input.hitCount));
  return { hit: true, crit, hitCount: hits, damage: dmg * hits };
}

// Mana uptime — stats_summary.md §5 / master_spec.md §5.
// 가동률 = MIN(1, 10% ÷ (5% × 공격속도배율)).
// As attack speed approaches its 3x cap, uptime settles ~67% and stays there
// forever — the mechanism that keeps mana/mana-regen stats relevant to the end.

import { atkSpeedMult } from './combat';

export const MANA_REGEN_PCT = 0.1; // 마나회복 = 최대마나 대비 10%/초
export const MANA_COST_PCT = 0.05; // 마나소모 = 최대마나 대비 5%/회

// Theoretical sustained cast uptime for a given agility.
export function manaUptime(agility: number): number {
  const speed = atkSpeedMult(agility);
  return Math.min(1, MANA_REGEN_PCT / (MANA_COST_PCT * speed));
}

// Uptime directly from an attack-speed multiplier (when a haste buff is folded in).
export function manaUptimeFromSpeed(speedMult: number): number {
  return Math.min(1, MANA_REGEN_PCT / (MANA_COST_PCT * speedMult));
}

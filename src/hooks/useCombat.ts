// Combat hooks — wrap combat-store selectors for leaf components.

import { useShallow } from 'zustand/react/shallow';
import { useCombatStore } from '../stores/useCombatStore';
import type { CombatLogEntry } from '../stores/useCombatStore';
import { toTargetInfo } from '../game/targeting';
import type { TargetInfo } from '../types/ScriptTypes';

// Current target as script-facing TargetInfo (+ raw HP for the bar).
export interface TargetView extends TargetInfo {
  currentHp: number;
  maxHp: number;
}

export function useTargetInfo(): TargetView | null {
  return useCombatStore(
    useShallow((s): TargetView | null => {
      if (!s.target) return null;
      return {
        ...toTargetInfo(s.target),
        currentHp: s.target.currentHp,
        maxHp: s.target.maxHp,
      };
    }),
  );
}

export function useCombatLog(): CombatLogEntry[] {
  return useCombatStore((s) => s.log);
}

export function useSelectedTier(): number {
  return useCombatStore((s) => s.selectedTier);
}

export function useActiveBuffs(): Record<string, number> {
  return useCombatStore(useShallow((s) => s.activeBuffs));
}

export function useCooldowns(): Record<string, number> {
  return useCombatStore(useShallow((s) => s.cooldowns));
}

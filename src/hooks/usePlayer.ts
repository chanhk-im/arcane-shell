// Player hooks — wrap store selectors so components never subscribe to the
// store directly (CLAUDE.md §1-2/§2-2). Derived values are computed here, never
// stored (CLAUDE.md §2-3).

import { useShallow } from 'zustand/react/shallow';
import {
  usePlayerStore,
  selectMaxMana,
  selectManaRegenPerSec,
} from '../stores/usePlayerStore';
import { intMult } from '../game/formulas/combat';
import { manaUptime } from '../game/formulas/manaUptime';
import type { CoreStats } from '../types/PlayerStats';

export interface ManaState {
  current: number;
  max: number;
  regenPerSec: number;
  ratio: number; // 0..1
  uptime: number; // theoretical sustained cast uptime
}

export function useManaState(): ManaState {
  return usePlayerStore(
    useShallow((s): ManaState => {
      const max = selectMaxMana(s);
      const regenPerSec = selectManaRegenPerSec(s);
      return {
        current: s.mana,
        max,
        regenPerSec,
        ratio: max > 0 ? s.mana / max : 0,
        uptime: manaUptime(s.coreStats.agility),
      };
    }),
  );
}

export function useCoreStats(): CoreStats {
  return usePlayerStore(useShallow((s) => s.coreStats));
}

export function useIntMultiplier(): number {
  return usePlayerStore((s) => intMult(s.coreStats.intelligence));
}

export interface Resources {
  manaStones: Record<number, number>;
  gold: number;
  fame: number;
  rank: number;
  grade: number;
}

export function useResources(): Resources {
  return usePlayerStore(
    useShallow((s) => ({
      manaStones: s.manaStones,
      gold: s.gold,
      fame: s.fame,
      rank: s.rank,
      grade: s.grade,
    })),
  );
}

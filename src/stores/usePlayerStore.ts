// Player domain store: core stats, mana, resources, rank/grade.
// Selector-only access from components (CLAUDE.md §2-2). Persisted, debounced.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistStorage, StorageValue } from 'zustand/middleware';
import type { CoreStats, CoreStatKey } from '../types/PlayerStats';
import { DEFAULT_DERIVED } from '../types/PlayerStats';
import { intMult } from '../game/formulas/combat';
import {
  BASE_STATS,
  PERSIST_DEBOUNCE_MS,
  maxManaFrom,
  manaRegenPerSecFrom,
} from '../game/constants';

export interface PlayerState {
  coreStats: CoreStats; // total = base + tree gains
  mana: number; // current mana
  manaStones: Record<number, number>; // by grade 1..5
  gold: number;
  bossMaterial: number;
  fame: number;
  rank: number; // 1..10
  grade: number; // 1..5 accessible mana-stone grade
  lastSeen: number; // epoch ms, for offline calc

  // actions
  applyStatDelta: (delta: Partial<CoreStats>) => void;
  setMana: (mana: number) => void;
  addManaStones: (grade: number, amount: number) => void;
  spendManaStones: (grade: number, amount: number) => boolean;
  addGold: (amount: number) => void;
  touchLastSeen: () => void;
}

const initialStones: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      coreStats: { ...BASE_STATS },
      mana: maxManaFrom(BASE_STATS.manaPool, intMult(BASE_STATS.intelligence)),
      manaStones: { ...initialStones },
      gold: 0,
      bossMaterial: 0,
      fame: 0,
      rank: 1,
      grade: 1,
      lastSeen: Date.now(),

      applyStatDelta: (delta) =>
        set((s) => {
          const next: CoreStats = { ...s.coreStats };
          (Object.keys(delta) as CoreStatKey[]).forEach((k) => {
            next[k] = next[k] + (delta[k] ?? 0);
          });
          return { coreStats: next };
        }),

      setMana: (mana) => set(() => ({ mana })),

      addManaStones: (grade, amount) =>
        set((s) => ({
          manaStones: { ...s.manaStones, [grade]: (s.manaStones[grade] ?? 0) + amount },
        })),

      spendManaStones: (grade, amount) => {
        const have = get().manaStones[grade] ?? 0;
        if (have < amount) return false;
        set((s) => ({
          manaStones: { ...s.manaStones, [grade]: have - amount },
        }));
        return true;
      },

      addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

      touchLastSeen: () => set(() => ({ lastSeen: Date.now() })),
    }),
    {
      name: 'arcane-shell.player',
      // Persist game state only (no transient UI). Debounce writes so we never
      // write per-tick (CLAUDE.md §2-4).
      partialize: (s) => ({
        coreStats: s.coreStats,
        mana: s.mana,
        manaStones: s.manaStones,
        gold: s.gold,
        bossMaterial: s.bossMaterial,
        fame: s.fame,
        rank: s.rank,
        grade: s.grade,
        lastSeen: s.lastSeen,
      }),
      storage: debouncedLocalStorage(PERSIST_DEBOUNCE_MS),
    },
  ),
);

// ---- Derived selectors (computed, never stored) — CLAUDE.md §2-3 ----

export function selectMaxMana(s: PlayerState): number {
  return maxManaFrom(s.coreStats.manaPool, intMult(s.coreStats.intelligence));
}

export function selectManaRegenPerSec(s: PlayerState): number {
  return manaRegenPerSecFrom(s.coreStats.manaRegen, intMult(s.coreStats.intelligence));
}

export function selectDerived() {
  return DEFAULT_DERIVED; // rune-only stats, not present until Rank 6
}

// ---- Debounced localStorage adapter (shared by persisted stores) ----
// Batches rapid writes into one localStorage.setItem per `delay`.
export function debouncedLocalStorage<T>(delay: number): PersistStorage<T> {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  return {
    getItem: (name): StorageValue<T> | null => {
      const raw = localStorage.getItem(name);
      return raw ? (JSON.parse(raw) as StorageValue<T>) : null;
    },
    setItem: (name, value) => {
      const existing = timers.get(name);
      if (existing) clearTimeout(existing);
      timers.set(
        name,
        setTimeout(() => {
          localStorage.setItem(name, JSON.stringify(value));
          timers.delete(name);
        }, delay),
      );
    },
    removeItem: (name) => {
      const existing = timers.get(name);
      if (existing) clearTimeout(existing);
      localStorage.removeItem(name);
    },
  };
}

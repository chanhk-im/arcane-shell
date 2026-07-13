// Combat domain store: current target, capped combat log, active buffs,
// cooldowns. Transient (not persisted). The game loop mutates buff/cooldown
// timers and target HP; the store only reflects results (CLAUDE.md §1-4).

import { create } from 'zustand';
import type { MonsterInstance } from '../types/Monster';
import { COMBAT_LOG_MAX } from '../game/constants';
import { spawnMonster } from '../game/data/monsters';

export type LogKind = 'damage' | 'crit' | 'kill' | 'system' | 'script' | 'miss' | 'error' | 'cmd';

export interface CombatLogEntry {
  id: number;
  text: string;
  kind: LogKind;
}

export interface CombatState {
  selectedTier: number;
  target: MonsterInstance | null;
  log: CombatLogEntry[];
  activeBuffs: Record<string, number>; // spellId -> remaining seconds
  cooldowns: Record<string, number>; // spellId -> remaining seconds

  selectTier: (tier: number) => void;
  setTarget: (target: MonsterInstance | null) => void;
  damageTarget: (amount: number) => void; // returns nothing; loop reads killed
  respawn: () => void;
  appendLog: (text: string, kind: LogKind) => void;
  setBuff: (spellId: string, remaining: number) => void;
  setCooldown: (spellId: string, remaining: number) => void;
  tickTimers: (dtSec: number) => void;
}

let logSeq = 0;

export const useCombatStore = create<CombatState>()((set) => ({
  selectedTier: 1,
  target: spawnMonster(1),
  log: [],
  activeBuffs: {},
  cooldowns: {},

  selectTier: (tier) =>
    set(() => ({ selectedTier: tier, target: spawnMonster(tier) })),

  setTarget: (target) => set(() => ({ target })),

  damageTarget: (amount) =>
    set((s) => {
      if (!s.target) return s;
      const currentHp = Math.max(0, s.target.currentHp - amount);
      return { target: { ...s.target, currentHp } };
    }),

  respawn: () =>
    set((s) => ({ target: spawnMonster(s.selectedTier) })),

  appendLog: (text, kind) =>
    set((s) => {
      logSeq += 1;
      const entry: CombatLogEntry = { id: logSeq, text, kind };
      // Ring buffer: keep only the most recent COMBAT_LOG_MAX entries
      // (CLAUDE.md §1-3 — never accumulate without bound).
      const log = s.log.length >= COMBAT_LOG_MAX
        ? [...s.log.slice(s.log.length - COMBAT_LOG_MAX + 1), entry]
        : [...s.log, entry];
      return { log };
    }),

  setBuff: (spellId, remaining) =>
    set((s) => ({ activeBuffs: { ...s.activeBuffs, [spellId]: remaining } })),

  setCooldown: (spellId, remaining) =>
    set((s) => ({ cooldowns: { ...s.cooldowns, [spellId]: remaining } })),

  tickTimers: (dtSec) =>
    set((s) => {
      const decay = (m: Record<string, number>) => {
        let changed = false;
        const next: Record<string, number> = {};
        for (const k in m) {
          const v = m[k] - dtSec;
          if (v > 0) next[k] = v;
          else changed = true;
        }
        return changed ? next : m;
      };
      const activeBuffs = decay(s.activeBuffs);
      const cooldowns = decay(s.cooldowns);
      if (activeBuffs === s.activeBuffs && cooldowns === s.cooldowns) return s;
      return { activeBuffs, cooldowns };
    }),
}));

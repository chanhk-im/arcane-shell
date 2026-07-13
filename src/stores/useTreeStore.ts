// Arcana Tree store: node states for all 55 depths (only 1-10 functional this
// milestone; 11-55 present as locked placeholders). Purchasing/enhancing a node
// spends mana stones (via usePlayerStore) and applies a stat delta.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TreeNodeState } from '../types/TreeNode';
import type { CoreStats } from '../types/PlayerStats';
import { CORE_STAT_KEYS } from '../types/PlayerStats';
import { TREE_NODES, enhancementCost, nodeStatGain } from '../game/formulas/treeCost';
import { PERSIST_DEBOUNCE_MS } from '../game/constants';
import { usePlayerStore, debouncedLocalStorage } from './usePlayerStore';

// Depths functional this milestone (Rank 1 = depths 1-10).
export const MAX_FUNCTIONAL_DEPTH = 10;

// Deterministic per-node enhancement cap in [5,10] (master_spec.md §3: "5~10회
// 개별 지정"). Derived from depth so it's stable across reloads.
function maxLevelFor(depth: number): number {
  return 5 + (depth % 6); // 5..10
}

function buildInitialNodes(): Record<number, TreeNodeState> {
  const nodes: Record<number, TreeNodeState> = {};
  for (const n of TREE_NODES) {
    nodes[n.depth] = { depth: n.depth, level: 0, maxLevel: maxLevelFor(n.depth) };
  }
  return nodes;
}

export interface TreeState {
  nodes: Record<number, TreeNodeState>;
  // Purchase (level 0->1) or enhance (level L->L+1). Returns false if locked,
  // maxed, or unaffordable.
  buyNode: (depth: number) => boolean;
}

// Per-stat delta from raising a node from `fromLevel` to `toLevel`.
function statDeltaBetween(depth: number, fromLevel: number, toLevel: number): Partial<CoreStats> {
  const gain = nodeStatGain(depth, toLevel) - nodeStatGain(depth, fromLevel);
  const delta: Partial<CoreStats> = {};
  for (const k of CORE_STAT_KEYS) delta[k] = gain; // equal split to all 5 stats
  return delta;
}

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      nodes: buildInitialNodes(),

      buyNode: (depth) => {
        const node = get().nodes[depth];
        if (!node) return false;
        if (depth > MAX_FUNCTIONAL_DEPTH) return false; // locked this milestone
        if (node.level >= node.maxLevel) return false; // maxed

        const nextLevel = node.level + 1;
        const cost = Math.ceil(enhancementCost(depth, nextLevel));
        const meta = TREE_NODES.find((n) => n.depth === depth)!;

        const player = usePlayerStore.getState();
        if (!player.spendManaStones(meta.grade, cost)) return false;

        // Apply stat gain for this level step.
        player.applyStatDelta(statDeltaBetween(depth, node.level, nextLevel));

        set((s) => ({
          nodes: { ...s.nodes, [depth]: { ...node, level: nextLevel } },
        }));
        return true;
      },
    }),
    {
      name: 'arcane-shell.tree',
      partialize: (s) => ({ nodes: s.nodes }),
      storage: debouncedLocalStorage(PERSIST_DEBOUNCE_MS),
    },
  ),
);

// Total per-stat bonus currently granted by the tree (derived, not stored).
export function selectTreeStatBonus(s: TreeState): number {
  let total = 0;
  for (const depth in s.nodes) {
    total += nodeStatGain(Number(depth), s.nodes[depth].level);
  }
  return total;
}

// Arcana Tree hooks.

import { useShallow } from 'zustand/react/shallow';
import { useTreeStore, MAX_FUNCTIONAL_DEPTH } from '../stores/useTreeStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { TREE_NODES, enhancementCost, nodeStatGain } from '../game/formulas/treeCost';
import { UNLOCK_NODES } from '../types/TreeNode';
import type { TreeNodeState } from '../types/TreeNode';

export interface TreeNodeView {
  depth: number;
  rank: number;
  grade: number;
  level: number;
  maxLevel: number;
  nextCost: number; // cost to buy the next level (0 if maxed/locked)
  affordable: boolean;
  locked: boolean; // beyond this milestone's functional depth
  maxed: boolean;
  unlockLabel: string | null; // name if this is one of the 12 unlock nodes
  perStatGain: number; // current per-stat contribution
}

export function useTreeNodes(): TreeNodeView[] {
  const nodes = useTreeStore(useShallow((s) => s.nodes));
  const manaStones = usePlayerStore(useShallow((s) => s.manaStones));

  return TREE_NODES.map((meta) => {
    const state: TreeNodeState = nodes[meta.depth];
    const level = state?.level ?? 0;
    const maxLevel = state?.maxLevel ?? 0;
    const locked = meta.depth > MAX_FUNCTIONAL_DEPTH;
    const maxed = level >= maxLevel;
    const nextCost = maxed || locked ? 0 : Math.ceil(enhancementCost(meta.depth, level + 1));
    const have = manaStones[meta.grade] ?? 0;
    return {
      depth: meta.depth,
      rank: meta.rank,
      grade: meta.grade,
      level,
      maxLevel,
      nextCost,
      affordable: !locked && !maxed && have >= nextCost,
      locked,
      maxed,
      unlockLabel: UNLOCK_NODES[meta.depth] ?? null,
      perStatGain: nodeStatGain(meta.depth, level),
    };
  });
}

export function useBuyNode(): (depth: number) => boolean {
  return useTreeStore((s) => s.buyNode);
}

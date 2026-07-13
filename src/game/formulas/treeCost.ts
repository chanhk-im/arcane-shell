// Arcana Tree cost & stat-gain formulas — 1:1 with
// arcane_shell_tree_node_cost.xlsx and stats_summary.md §3-1 / master_spec.md §3.
// The per-depth 1강 (level-1) base cost is the canonical value extracted from
// the spreadsheet (src/game/data/treeNodes.json); this module derives the
// analytic curve (for verification) plus enhancement cost and stat gain.

import treeNodesJson from '../data/treeNodes.json';
import type { TreeNodeData } from '../../types/TreeNode';
import { UNLOCK_NODES, UNLOCK_NODE_COST_MULT } from '../../types/TreeNode';

export const TREE_NODES = treeNodesJson as TreeNodeData[];

const NODE_BY_DEPTH = new Map<number, TreeNodeData>(
  TREE_NODES.map((n) => [n.depth, n]),
);

// Per-node enhancement growth: +25% compounding (master_spec.md §3).
export const ENHANCE_GROWTH = 0.25;

// Stat-gain constant. stats_summary.md §3-1:
//   스탯증가량 = 깊이당노드수(6) × k(0.0252) × 1강비용 × 1/5 (per stat).
// We model one UI node per depth, so fold 6 × (1/5) into the constant.
export const STAT_K = 0.0252;
export const STAT_GAIN_PER_COST = (6 * STAT_K) / 5; // 0.03024

export function getNode(depth: number): TreeNodeData | undefined {
  return NODE_BY_DEPTH.get(depth);
}

function isUnlockNode(depth: number): boolean {
  return Object.prototype.hasOwnProperty.call(UNLOCK_NODES, depth);
}

// Level-1 (unlock) cost for a depth, applying the 1.5x premium for the 12
// unlock nodes (master_spec.md §3). Returns 0 for unknown depths.
export function baseCost(depth: number): number {
  const node = NODE_BY_DEPTH.get(depth);
  if (!node) return 0;
  return isUnlockNode(depth) ? node.baseCost * UNLOCK_NODE_COST_MULT : node.baseCost;
}

// Cost to enhance a node from (level-1) to `level` — the level-th purchase.
// level 1 = unlock (baseCost); each subsequent level compounds +25%.
export function enhancementCost(depth: number, level: number): number {
  if (level < 1) return 0;
  return baseCost(depth) * Math.pow(1 + ENHANCE_GROWTH, level - 1);
}

// Analytic reconstruction of the spreadsheet's per-depth base cost, kept for
// verification (unit tests spot-check this against treeNodes.json). Grade base
// costs 10/20/30/40/50 reset at each grade's first depth, then grow by the
// grade growth rate per depth, with a +30% rank-transition bump inside a grade.
const GRADE_BASE = [10, 20, 30, 40, 50];
const GRADE_GROWTH = [0.4, 0.7, 1.0, 1.25, 1.5];
const RANK_TRANSITION_MULT = 0.3;

// grade-first depths: 1(g1), 16(g2), 26(g3), 36(g4), 46(g5). Rank spans per
// grade: g1 covers ranks 1-2 (depth 11 is the rank1->2 transition), etc.
export function analyticBaseCost(node: TreeNodeData): number {
  const g = node.grade;
  const growth = GRADE_GROWTH[g - 1];
  // Depth index within the grade block.
  const gradeFirstDepth = TREE_NODES.find((n) => n.grade === g)!.depth;
  const stepsIntoGrade = node.depth - gradeFirstDepth;
  let cost = GRADE_BASE[g - 1] * Math.pow(1 + growth, stepsIntoGrade);
  // Count rank transitions crossed inside this grade (each adds +30%).
  const firstRank = TREE_NODES.find((n) => n.grade === g)!.rank;
  const rankTransitions = node.rank - firstRank;
  cost *= Math.pow(1 + RANK_TRANSITION_MULT, rankTransitions);
  return cost;
}

// Stat gain (to EACH of the 5 core stats) from owning a node at `level`.
// Cumulative across enhancement levels, scaled by the same base-cost rhythm as
// the cost curve (stats_summary.md §3-1). Returns per-stat gain.
export function nodeStatGain(depth: number, level: number): number {
  if (level < 1) return 0;
  const base = baseCost(depth);
  // Each level contributes proportionally to that level's cost multiplier.
  let total = 0;
  for (let l = 1; l <= level; l += 1) {
    total += STAT_GAIN_PER_COST * base * Math.pow(1 + ENHANCE_GROWTH, l - 1);
  }
  return total;
}

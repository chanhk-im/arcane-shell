// Arcana Tree — 55 depths / 10 ranks (master_spec.md §3).
// Cost data parsed from arcane_shell_tree_node_cost.xlsx.

// One depth's static cost data. This milestone models one purchasable node per
// depth (the spreadsheet's "6 nodes per depth" assumption is folded into the
// stat-gain constant in formulas/treeCost.ts).
export interface TreeNodeData {
  depth: number; // 1..55
  rank: number; // 1..10
  grade: number; // required mana-stone grade 1..5
  baseCost: number; // 1강 (level-1) unlock cost, in mana stones of `grade`
}

// The 12 unlock nodes and their depths (master_spec.md §3 table).
// Cost multiplier for these is 1.5x the normal node at the same depth.
export const UNLOCK_NODES: Record<number, string> = {
  3: '스크립트',
  6: '마법 길드',
  9: '부품 정비소',
  12: '몬스터 도감',
  17: '차원 균열',
  23: '경매장',
  27: '유물 시스템',
  32: '룬 각인',
  37: 'AI 도제',
  43: '길드 레이드',
  47: '차원 심층',
  55: '재귀 컴파일',
};

export const UNLOCK_NODE_COST_MULT = 1.5;

// Runtime state of a node (persisted).
export interface TreeNodeState {
  depth: number;
  level: number; // 0 = not purchased, 1..maxLevel purchased/enhanced
  maxLevel: number; // 5..10 enhancement cap, assigned per node
}

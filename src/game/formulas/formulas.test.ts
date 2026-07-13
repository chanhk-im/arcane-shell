import { describe, it, expect } from 'vitest';
import {
  hitChance,
  critChance,
  atkSpeedMult,
  intMult,
  defenseMitigation,
  elementalModifier,
} from './combat';
import {
  TREE_NODES,
  analyticBaseCost,
  enhancementCost,
  baseCost,
} from './treeCost';

describe('combat asymptotes (stats_summary.md §1)', () => {
  it('hitChance: 0.90 base, converges to 0.99', () => {
    expect(hitChance(0)).toBeCloseTo(0.9, 6);
    expect(hitChance(1e9)).toBeGreaterThan(0.9899);
    expect(hitChance(1e9)).toBeLessThanOrEqual(0.99);
  });

  it('critChance: 0.05 base, converges to 0.80', () => {
    expect(critChance(0)).toBeCloseTo(0.05, 6);
    expect(critChance(1e9)).toBeGreaterThan(0.7999);
    expect(critChance(1e9)).toBeLessThanOrEqual(0.8);
  });

  it('atkSpeedMult: 1.0 base, converges to 3.0', () => {
    expect(atkSpeedMult(0)).toBeCloseTo(1, 6);
    expect(atkSpeedMult(1e9)).toBeGreaterThan(2.999);
    expect(atkSpeedMult(1e9)).toBeLessThanOrEqual(3);
  });

  it('intMult: 1 + int/100, uncapped', () => {
    expect(intMult(0)).toBe(1);
    expect(intMult(100)).toBe(2);
    expect(intMult(900)).toBe(10);
  });
});

describe('defense & elemental (master_spec.md §2)', () => {
  it('defenseMitigation = 100/(100+def-pen)', () => {
    expect(defenseMitigation(0, 0)).toBe(1);
    expect(defenseMitigation(100, 0)).toBeCloseTo(0.5, 6);
    expect(defenseMitigation(50, 50)).toBe(1); // full pen
  });

  it('elemental 4-cycle + opposed pair', () => {
    expect(elementalModifier('화', '수')).toBe(1.25); // fire beats water
    expect(elementalModifier('수', '화')).toBe(0.75); // reverse
    expect(elementalModifier('성', '암')).toBe(1.25);
    expect(elementalModifier('암', '성')).toBe(1.25);
    expect(elementalModifier('화', '화')).toBe(1.0);
    expect(elementalModifier('화', '뇌')).toBe(1.0); // non-adjacent neutral
  });
});

describe('tree cost curve (arcane_shell_tree_node_cost.xlsx)', () => {
  it('analytic reconstruction matches extracted baseCost per depth', () => {
    for (const node of TREE_NODES) {
      expect(analyticBaseCost(node)).toBeCloseTo(node.baseCost, 4);
    }
  });

  it('grade-1 base-cost sum ≈ 4,814 (.md anchor)', () => {
    const sum = TREE_NODES.filter((n) => n.grade === 1).reduce((a, n) => a + n.baseCost, 0);
    expect(Math.round(sum)).toBe(4814);
  });

  it('enhancement compounds +25% per level', () => {
    const b = baseCost(20); // normal node, not an unlock node
    expect(enhancementCost(20, 1)).toBeCloseTo(b, 6);
    expect(enhancementCost(20, 2)).toBeCloseTo(b * 1.25, 6);
    expect(enhancementCost(20, 3)).toBeCloseTo(b * 1.25 * 1.25, 6);
  });

  it('unlock nodes cost 1.5x the normal node (depth 3 = 스크립트)', () => {
    const node = TREE_NODES.find((n) => n.depth === 3)!;
    expect(baseCost(3)).toBeCloseTo(node.baseCost * 1.5, 6);
  });
});

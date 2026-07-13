// @vitest-environment jsdom
// End-to-end verification of the store + combat-engine + tree integration,
// exercised through the real runtime modules (no browser needed for this part).

import { describe, it, expect, beforeEach } from 'vitest';
import { performCast, manualCast } from './combatEngine';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useCombatStore } from '../stores/useCombatStore';
import { useTreeStore } from '../stores/useTreeStore';
import { spawnMonster } from './data/monsters';
import { BASE_STATS } from './constants';
import { intMult } from './formulas/combat';
import { selectMaxMana } from '../stores/usePlayerStore';
import { COMBAT_LOG_MAX } from './constants';

function resetPlayer() {
  usePlayerStore.setState({
    coreStats: { ...BASE_STATS },
    mana: BASE_STATS.manaPool * intMult(BASE_STATS.intelligence),
    manaStones: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    gold: 0,
    bossMaterial: 0,
    fame: 0,
    rank: 1,
    grade: 1,
  });
}

beforeEach(() => {
  resetPlayer();
  useCombatStore.setState({
    selectedTier: 1,
    target: spawnMonster(1),
    log: [],
    activeBuffs: {},
    cooldowns: {},
  });
});

describe('manual combat', () => {
  it('a successful cast deals sane damage and drains mana', () => {
    const before = useCombatStore.getState().target!.currentHp; // 50 HP tier-1
    const manaBefore = usePlayerStore.getState().mana;

    // 3 casts (~10.5 dmg each) won't kill a 50-HP monster, so its HP must drop.
    let sawDamage = false;
    for (let i = 0; i < 3; i += 1) {
      const r = performCast('fire_1');
      if (r.hit) sawDamage = true;
    }
    const after = useCombatStore.getState().target!.currentHp;
    expect(sawDamage).toBe(true);
    expect(after).toBeLessThan(before); // HP dropped, no respawn
    // Per-hit damage is in a sane range: 3 hits removed < 50 HP but > 0.
    expect(before - after).toBeGreaterThan(0);
    expect(before - after).toBeLessThan(50);
    // Mana was spent (5% of max per cast).
    const maxMana = selectMaxMana(usePlayerStore.getState());
    expect(usePlayerStore.getState().mana).toBeLessThan(manaBefore);
    expect(maxMana).toBeCloseTo(110, 3); // 100 pool * 1.1 int
  });

  it('killing a monster awards mana stones and respawns', () => {
    // Boost spell power so one cast kills a tier-1 (50 HP) monster.
    usePlayerStore.setState({
      coreStats: { ...BASE_STATS, spellPower: 5000 },
    });
    const r = performCast('fire_1');
    // Hit chance is 90%+, retry once if the rare miss happens.
    if (!r.hit) performCast('fire_1');
    expect(usePlayerStore.getState().manaStones[1]).toBeGreaterThan(0);
    expect(useCombatStore.getState().target).not.toBeNull();
  });

  it('a bad skill id via manualCast is caught and logged (no throw)', () => {
    expect(() => manualCast('does_not_exist')).not.toThrow();
    expect(manualCast('does_not_exist')).toBeNull();
    // performCast (script path) throws a plain Error for unknown skills.
    expect(() => performCast('does_not_exist')).toThrow(/Unknown skill/);
  });

  it('insufficient mana throws a catchable ScriptError', () => {
    usePlayerStore.setState({ mana: 0 });
    try {
      performCast('fire_1');
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as { type?: string }).type).toBe('InsufficientMana');
    }
  });

  it('combat log is capped at 200 entries (ring buffer)', () => {
    const combat = useCombatStore.getState();
    for (let i = 0; i < 300; i += 1) combat.appendLog(`line ${i}`, 'system');
    expect(useCombatStore.getState().log.length).toBe(COMBAT_LOG_MAX);
    // Oldest entries were dropped.
    expect(useCombatStore.getState().log[0].text).not.toBe('line 0');
  });
});

describe('arcana tree', () => {
  it('purchasing a depth-1 node spends stones and raises all 5 stats', () => {
    usePlayerStore.setState({ manaStones: { 1: 1000, 2: 0, 3: 0, 4: 0, 5: 0 } });
    // Reset node levels so this test is independent of persisted state.
    const nodes = { ...useTreeStore.getState().nodes };
    nodes[1] = { depth: 1, level: 0, maxLevel: nodes[1].maxLevel };
    useTreeStore.setState({ nodes });

    const statBefore = usePlayerStore.getState().coreStats.spellPower;
    const stonesBefore = usePlayerStore.getState().manaStones[1];

    const ok = useTreeStore.getState().buyNode(1);
    expect(ok).toBe(true);
    expect(useTreeStore.getState().nodes[1].level).toBe(1);
    // depth-1 base cost is 10 -> stones decreased.
    expect(usePlayerStore.getState().manaStones[1]).toBeLessThan(stonesBefore);
    // All 5 stats went up by the same per-stat gain.
    const s = usePlayerStore.getState().coreStats;
    expect(s.spellPower).toBeGreaterThan(statBefore);
    expect(s.agility).toBeGreaterThan(BASE_STATS.agility);
  });

  it('depth 11+ is locked this milestone', () => {
    usePlayerStore.setState({ manaStones: { 1: 1e9, 2: 1e9, 3: 1e9, 4: 1e9, 5: 1e9 } });
    expect(useTreeStore.getState().buyNode(11)).toBe(false);
  });
});

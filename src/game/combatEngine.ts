// Combat orchestration shared by the manual UI and the script bridge.
// Pure math lives in formulas/; this module reads/writes stores and rolls RNG.
// A cast either returns a CastResult or throws — typed ScriptError for the 3
// catchable cases (script_api.md §1-1a), a plain Error for anything else
// (e.g. unknown skill id) which terminates a running script.

import { usePlayerStore, selectMaxMana } from '../stores/usePlayerStore';
import { useCombatStore } from '../stores/useCombatStore';
import { getSkill } from './data/skills';
import { resolveDamage } from './formulas/combat';
import type { DamageInputs } from './formulas/combat';
import type { CastResult, ScriptError } from '../types/ScriptTypes';
import { makeScriptError } from '../types/ScriptTypes';
import type { MonsterInstance } from '../types/Monster';
import { rollDrop, spawnMonster } from './data/monsters';
import { DEFAULT_DERIVED } from '../types/PlayerStats';
import { formatNumber } from './formulas/formatNumber';

const HIT_COUNT = 1; // GPU expected-hits not in scope this milestone (=1)

function buffActive(id: string): boolean {
  return (useCombatStore.getState().activeBuffs[id] ?? 0) > 0;
}

// Cast a deal or buff skill. `explicitTarget` mirrors script cast(spell, target?).
export function performCast(spellId: string, explicitTarget?: MonsterInstance | null): CastResult {
  const skill = getSkill(spellId);
  if (!skill) {
    // Not a catchable ScriptError -> fatal for scripts (plan verification case).
    throw new Error(`Unknown skill id: ${spellId}`);
  }

  const combat = useCombatStore.getState();
  const player = usePlayerStore.getState();
  const maxMana = selectMaxMana(player);

  // Buff-on-cooldown is catchable.
  if (skill.type === '버프' && (combat.cooldowns[spellId] ?? 0) > 0) {
    throw makeScriptError('Cooldown', `${spellId} is on cooldown`);
  }

  // Mana cost (% of max). Overload raises deal-skill cost by +5%p.
  let manaPct = skill.manaCost;
  if (skill.type === '딜' && buffActive('overload_buff')) manaPct += 5;
  const manaCost = maxMana * (manaPct / 100);
  if (player.mana < manaCost) {
    throw makeScriptError('InsufficientMana', `need ${formatNumber(manaCost)} mana`);
  }

  if (skill.type === '버프') {
    player.setMana(player.mana - manaCost);
    combat.setBuff(spellId, skill.duration);
    combat.setCooldown(spellId, skill.cooldown);
    combat.appendLog(`buff ${skill.label} 발동 (${skill.duration}s)`, 'system');
    return { hit: true, crit: false, hitCount: 0, killed: false };
  }

  // Deal skill: need a live target.
  const target = explicitTarget ?? combat.target;
  if (!target || target.currentHp <= 0) {
    throw makeScriptError('NoTarget', 'no valid target');
  }

  const stats = player.coreStats;
  const input: DamageInputs = {
    spellPower: stats.spellPower,
    intelligence: stats.intelligence,
    agility: stats.agility,
    skillCoefficient: skill.coefficient,
    critDamage: DEFAULT_DERIVED.critDamage,
    armorPen: DEFAULT_DERIVED.armorPen,
    attackerElement: skill.element,
    defenderElement: target.element,
    defenderDefense: target.defense,
    hitCount: HIT_COUNT,
    focusCritBonus: buffActive('focus_buff') ? 0.2 : 0,
    overloadSpellPowerPct: buffActive('overload_buff') ? 0.5 : 0,
  };

  const result = resolveDamage(input, Math.random(), Math.random());
  player.setMana(player.mana - manaCost);

  if (!result.hit) {
    combat.appendLog(`${skill.label} 빗나감 (miss)`, 'miss');
    return { hit: false, crit: false, hitCount: 0, killed: false };
  }

  // Single live monster this milestone: damage the store's current target.
  const newHp = Math.max(0, target.currentHp - result.damage);
  const dmgText = `${skill.label} ${result.crit ? 'CRIT ' : ''}-${formatNumber(result.damage)}`;
  combat.damageTarget(result.damage);

  if (newHp <= 0) {
    resolveKill(target);
    combat.appendLog(`${dmgText} → tier ${target.tier} 처치`, 'kill');
    return { hit: true, crit: result.crit, hitCount: result.hitCount, killed: true };
  }
  combat.appendLog(dmgText, result.crit ? 'crit' : 'damage');
  return { hit: true, crit: result.crit, hitCount: result.hitCount, killed: false };
}

// UI entry point: cast from a button, converting throws into log lines so the
// component never has to handle exceptions.
export function manualCast(spellId: string): CastResult | null {
  try {
    return performCast(spellId);
  } catch (err) {
    const combat = useCombatStore.getState();
    if (err && typeof err === 'object' && 'type' in err) {
      const e = err as ScriptError;
      combat.appendLog(`cast 실패: ${e.name} — ${e.message}`, 'miss');
    } else {
      combat.appendLog(`cast 오류: ${(err as Error).message}`, 'miss');
    }
    return null;
  }
}

function resolveKill(target: MonsterInstance): void {
  const player = usePlayerStore.getState();
  const combat = useCombatStore.getState();
  const drop = rollDrop(target);
  if (drop > 0) player.addManaStones(target.manaStoneGrade, drop);
  combat.appendLog(
    `+${drop} 마석(등급${target.manaStoneGrade})`,
    'system',
  );
  // Respawn the same tier as the next target.
  const next = spawnMonster(combat.selectedTier);
  combat.setTarget(next);
}

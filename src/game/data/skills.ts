// Skill definitions. Milestone 1 = the 6 grade-1 deal skills (one per element)
// + the 3 buff skills. Coefficients follow content_design.md §1 (grade 1 = 1.0);
// buff numbers follow master_spec.md §5-1. Mana costs are % of max mana.

import type { SkillDef } from '../../types/Skill';
import type { Element } from '../../types/Element';
import { ELEMENTS, ELEMENT_EN, ELEMENT_SKILL_VERB } from '../../types/Element';
import { MANA_COST_PCT } from '../formulas/manaUptime';

// Grade-1 skill coefficient (content_design.md §1: 1.0 → 1.5 → 2.25 ...).
export const GRADE1_COEFFICIENT = 1.0;
const DEAL_MANA_PCT = MANA_COST_PCT * 100; // 5

// One deal skill per element at grade 1. id = `${elementEn}_1`.
const DEAL_SKILLS: SkillDef[] = ELEMENTS.map((element: Element) => ({
  id: `${ELEMENT_EN[element]}_1`,
  element,
  grade: 1,
  type: '딜',
  manaCost: DEAL_MANA_PCT,
  cooldown: 0,
  duration: 0,
  label: `${ELEMENT_SKILL_VERB[element]}()`,
  coefficient: GRADE1_COEFFICIENT,
}));

// Buff skills (master_spec.md §5-1). Duration < cooldown, so never permanent.
const BUFF_SKILLS: SkillDef[] = [
  {
    id: 'haste_buff',
    element: '성',
    grade: 1,
    type: '버프',
    manaCost: 5,
    cooldown: 30,
    duration: 10,
    label: '가속 haste',
    coefficient: 0,
    buff: { atkSpeedPct: 0.3 },
  },
  {
    id: 'focus_buff',
    element: '성',
    grade: 1,
    type: '버프',
    manaCost: 5,
    cooldown: 30,
    duration: 10,
    label: '집중 focus',
    coefficient: 0,
    buff: { critChanceFlat: 0.2 },
  },
  {
    id: 'overload_buff',
    element: '암',
    grade: 1,
    type: '버프',
    manaCost: 8,
    cooldown: 40,
    duration: 8,
    label: '과부하 overload',
    coefficient: 0,
    buff: { spellPowerPct: 0.5, manaCostFlatPct: 5 },
  },
];

export const ALL_SKILLS: SkillDef[] = [...DEAL_SKILLS, ...BUFF_SKILLS];

const SKILL_BY_ID = new Map<string, SkillDef>(ALL_SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): SkillDef | undefined {
  return SKILL_BY_ID.get(id);
}

export function getDealSkills(): SkillDef[] {
  return DEAL_SKILLS;
}

export function getBuffSkills(): SkillDef[] {
  return BUFF_SKILLS;
}

// Deal skill for a given element (used by scripts / auto element matching).
export function dealSkillForElement(element: Element): SkillDef | undefined {
  return DEAL_SKILLS.find((s) => s.element === element);
}

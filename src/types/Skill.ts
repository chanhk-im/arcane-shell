import type { Element } from './Element';
import type { CoreStatKey } from './PlayerStats';

export type SkillType = '딜' | '버프';

// SpellInfo — exactly the shape exposed to scripts (script_api.md §1-2).
export interface SpellInfo {
  id: string;
  element: Element;
  grade: 1 | 2 | 3 | 4 | 5;
  type: SkillType;
  manaCost: number; // % of max mana per cast
  cooldown: number; // seconds (buff only; deal skills = 0)
  duration: number; // seconds (buff only)
}

// A buff's mechanical effect (master_spec.md §5-1).
export interface BuffEffect {
  // Additive stat/percent modifiers applied while active.
  atkSpeedPct?: number; // 가속: +0.30
  critChanceFlat?: number; // 집중: +0.20 (percentage points)
  spellPowerPct?: number; // 과부하: +0.50
  manaCostFlatPct?: number; // 과부하: +5 (raises deal-skill mana % by 5)
}

// Full skill definition (data-side; SpellInfo is the script-facing projection).
export interface SkillDef extends SpellInfo {
  label: string; // command-style display name, e.g. "ignite()"
  coefficient: number; // spell-power multiplier (grade-based, content_design §1)
  affectsStat?: CoreStatKey; // unused this milestone; reserved
  buff?: BuffEffect;
}

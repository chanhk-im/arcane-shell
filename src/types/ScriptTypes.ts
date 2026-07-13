import type { Element } from './Element';

// Result of a successful cast (script_api.md §1-1). Failures throw instead.
export interface CastResult {
  hit: boolean;
  crit: boolean;
  hitCount: number;
  killed: boolean;
}

// TargetInfo (script_api.md §1-3). `Target` in cast() is a reuse of this.
export interface TargetInfo {
  tier: number; // 1..22
  isBoss: boolean;
  element: Element;
  hpPercent: number; // 0..100
  defense: number;
  manaStoneGrade: 1 | 2 | 3 | 4 | 5;
}

// Active buff with remaining seconds (script_api.md §1-4).
export interface ActiveBuff {
  spellId: string;
  remaining: number; // seconds
}

// Typed, script-catchable exception codes (script_api.md §1-1a).
// The `type` string is what user scripts inspect (e.g. e.type === "InsufficientMana").
export type ScriptErrorType =
  | 'InsufficientMana'
  | 'Cooldown'
  | 'NoTarget';

export const SCRIPT_ERROR_NAME: Record<ScriptErrorType, string> = {
  InsufficientMana: 'InsufficientManaError',
  Cooldown: 'CooldownError',
  NoTarget: 'NoTargetError',
};

// Thrown across the bridge as a structured payload rather than a JS Error, so
// it survives the interpreter boundary. Scripts see an object with `.type`.
export interface ScriptError {
  type: ScriptErrorType;
  name: string;
  message: string;
}

export function makeScriptError(type: ScriptErrorType, message: string): ScriptError {
  return { type, name: SCRIPT_ERROR_NAME[type], message };
}

// Messages exchanged between the main thread and the script Worker.
export type ScriptCommand =
  | { kind: 'cast'; spellId: string; target: TargetInfo | null }
  | { kind: 'isReady'; spellId: string }
  | { kind: 'canAfford'; spellId: string }
  | { kind: 'getSpells' }
  | { kind: 'getSpellInfo'; spellId: string }
  | { kind: 'targetCurrent' }
  | { kind: 'targetSet'; selector: string }
  | { kind: 'targetList'; count: number }
  | { kind: 'selfBuffs' }
  | { kind: 'manaState' }
  | { kind: 'resourceGet'; resourceType: string }
  | { kind: 'systemMemory' };

// Script domain store: user source text, running state, console output (capped),
// memory usage. Source is persisted; runtime output is transient.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SCRIPT_MEMORY_MAX, PERSIST_DEBOUNCE_MS } from '../game/constants';
import { debouncedLocalStorage } from './usePlayerStore';

const CONSOLE_MAX = 200; // cap like the combat log (CLAUDE.md §1-3)

// NOTE: js-interpreter's bundled parser only accepts ES5 syntax (no `const`/
// `let`/arrow functions/template literals — its keyword table has no entry
// for them, and this can't be raised via an ecmaVersion option). Every script
// here and in game/script/prelude.ts must stick to `var` and ES5 expressions
// or the sandbox throws a SyntaxError before the script ever starts.
export const DEFAULT_SCRIPT = `// Auto-hunt: switch to the weakest target, cast the element-advantage
// deal skill, and back off when mana runs low.
var advantage = { "화": "수", "수": "뇌", "뇌": "지", "지": "화" };
var enMap = { "화": "fire", "수": "water", "뇌": "thunder", "지": "earth", "성": "light", "암": "dark" };

while (true) {
  if (mana.current < mana.max * 0.15) { sleep(300); continue; }
  target.set("weakest");
  var enemy = target.current;
  var adv = advantage[enemy.element];
  var spellId = adv ? enMap[adv] + "_1" : "light_1";
  try {
    var r = cast(spellId);
    if (r.killed) log("killed a tier " + enemy.tier);
  } catch (e) {
    if (e.type === "InsufficientMana") sleep(300);
    else if (e.type === "NoTarget") target.set("nearest");
  }
  sleep(100);
}
`;

// Pre-fix default script (shipped before this ES5 fix): used `const`, which
// js-interpreter's ES5-only parser rejects with a SyntaxError, so every
// session that never edited the script started broken. Matched verbatim (not
// just "contains const") on rehydrate so a user's own edited script is never
// silently overwritten — only the untouched broken shipped default is healed.
const BROKEN_V0_DEFAULT_SCRIPT = `// Auto-hunt: switch to the weakest target, cast the element-advantage
// deal skill, and back off when mana runs low.
const advantage = { "화": "수", "수": "뇌", "뇌": "지", "지": "화" };
const enMap = { "화": "fire", "수": "water", "뇌": "thunder", "지": "earth", "성": "light", "암": "dark" };

while (true) {
  if (mana.current < mana.max * 0.15) { sleep(300); continue; }
  target.set("weakest");
  const enemy = target.current;
  const adv = advantage[enemy.element];
  const spellId = adv ? enMap[adv] + "_1" : "light_1";
  try {
    const r = cast(spellId);
    if (r.killed) log("killed a tier " + enemy.tier);
  } catch (e) {
    if (e.type === "InsufficientMana") sleep(300);
    else if (e.type === "NoTarget") target.set("nearest");
  }
  sleep(100);
}
`;

export interface ScriptState {
  source: string;
  running: boolean;
  consoleOutput: string[];
  memoryUsed: number;
  memoryMax: number;

  setSource: (source: string) => void;
  setRunning: (running: boolean) => void;
  appendConsole: (line: string) => void;
  clearConsole: () => void;
  setMemoryUsed: (used: number) => void;
}

export const useScriptStore = create<ScriptState>()(
  persist(
    (set) => ({
      source: DEFAULT_SCRIPT,
      running: false,
      consoleOutput: [],
      memoryUsed: 0,
      memoryMax: SCRIPT_MEMORY_MAX,

      setSource: (source) => set(() => ({ source })),
      setRunning: (running) => set(() => ({ running })),
      appendConsole: (line) =>
        set((s) => {
          const out = [...s.consoleOutput, line];
          return { consoleOutput: out.length > CONSOLE_MAX ? out.slice(out.length - CONSOLE_MAX) : out };
        }),
      clearConsole: () => set(() => ({ consoleOutput: [] })),
      setMemoryUsed: (used) => set(() => ({ memoryUsed: used })),
    }),
    {
      name: 'arcane-shell.script',
      version: 1,
      // Heal sessions that persisted the broken pre-fix default before this
      // version bump (see BROKEN_V0_DEFAULT_SCRIPT). Any other persisted
      // source (including a user's own script, even a broken one they wrote
      // themselves) passes through untouched.
      migrate: (persisted) => {
        const state = persisted as { source?: string } | undefined;
        if (state?.source === BROKEN_V0_DEFAULT_SCRIPT) {
          return { ...state, source: DEFAULT_SCRIPT };
        }
        return state as { source: string };
      },
      partialize: (s) => ({ source: s.source }),
      storage: debouncedLocalStorage(PERSIST_DEBOUNCE_MS),
    },
  ),
);

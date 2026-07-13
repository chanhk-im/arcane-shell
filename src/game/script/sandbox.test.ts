// Verifies the sandbox INTERPRETER SEMANTICS directly (the core of Step 7):
// the API prelude, synchronous cast(), catchable vs fatal errors, and the
// step-budget that force-terminates a no-sleep infinite loop. The Worker +
// SharedArrayBuffer transport (scriptWorker.ts) is thin glue around exactly
// this stepping logic and requires a browser to run; here we drive the same
// Interpreter + prelude with an in-process fake bridge.

import { describe, it, expect } from 'vitest';
import Interpreter from 'js-interpreter';
import { API_PRELUDE } from './prelude';

// Minimal fake of the main-thread dispatcher used by scriptHost.
function fakeCall(method: string, argJson: string): string {
  const arg = JSON.parse(argJson);
  switch (method) {
    case 'cast': {
      if (arg.spellId === 'bogus') {
        // Fatal error: no `type` -> uncaught throw should terminate.
        return JSON.stringify({ e: { name: 'Error', message: 'Unknown skill id: bogus' } });
      }
      if (arg.spellId === 'nomana') {
        return JSON.stringify({ e: { type: 'InsufficientMana', name: 'InsufficientManaError', message: 'no mana' } });
      }
      return JSON.stringify({ v: { hit: true, crit: false, hitCount: 1, killed: false } });
    }
    case 'mana.current':
      return JSON.stringify({ v: 100 });
    case 'mana.max':
      return JSON.stringify({ v: 100 });
    case 'target.current':
      return JSON.stringify({ v: { tier: 1, isBoss: false, element: '화', hpPercent: 50, defense: 5, manaStoneGrade: 1 } });
    case 'target.set':
      return JSON.stringify({ v: true });
    default:
      return JSON.stringify({ v: null });
  }
}

const logs: string[] = [];

function build(source: string): Interpreter {
  logs.length = 0;
  return new Interpreter(`${API_PRELUDE}\n${source}`, (interp, globalObject) => {
    interp.setProperty(
      globalObject,
      '__call',
      interp.createNativeFunction((m: unknown, a: unknown) => fakeCall(String(m), a == null ? 'null' : String(a))),
    );
    interp.setProperty(
      globalObject,
      '__log',
      interp.createNativeFunction((l: unknown) => {
        logs.push(String(l));
        return undefined;
      }),
    );
    interp.setProperty(
      globalObject,
      'sleep',
      interp.createNativeFunction(() => undefined), // no real blocking in tests
    );
  });
}

// Run to completion with a hard step cap; returns how it ended.
function runBounded(interp: Interpreter, cap: number): { done: boolean; steps: number; error?: string } {
  let steps = 0;
  try {
    while (interp.step()) {
      steps += 1;
      if (steps >= cap) return { done: false, steps };
    }
    return { done: true, steps };
  } catch (err) {
    return { done: true, steps, error: err instanceof Error ? err.message : String(err) };
  }
}

describe('script sandbox semantics', () => {
  it('runs a normal script to completion and cast() returns a CastResult', () => {
    const interp = build(`
      var r = cast("fire_1");
      log("hit=" + r.hit + " killed=" + r.killed);
      log("tier=" + target.current.tier);
      log("mana=" + mana.current + "/" + mana.max);
    `);
    const res = runBounded(interp, 100_000);
    expect(res.done).toBe(true);
    expect(res.error).toBeUndefined();
    expect(logs).toContain('hit=true killed=false');
    expect(logs).toContain('tier=1');
    expect(logs).toContain('mana=100/100');
  });

  it('a catchable error (InsufficientMana) can be handled by the script', () => {
    const interp = build(`
      try { cast("nomana"); log("no throw"); }
      catch (e) { log("caught " + e.type); }
    `);
    const res = runBounded(interp, 100_000);
    expect(res.done).toBe(true);
    expect(res.error).toBeUndefined();
    expect(logs).toContain('caught InsufficientMana');
  });

  it('a bad skill id throws an uncaught error that terminates the script', () => {
    const interp = build(`cast("bogus"); log("should not reach");`);
    const res = runBounded(interp, 100_000);
    // The script terminated (threw) and never reached the line after cast.
    expect(res.error).toBeDefined();
    expect(logs).not.toContain('should not reach');
    // The prelude surfaced the fatal message to the console before throwing.
    expect(logs).toContain('[fatal] Unknown skill id: bogus');
  });

  it('an infinite loop with no sleep never completes -> would trip the step budget', () => {
    const interp = build(`while (true) { var x = 1 + 1; }`);
    const res = runBounded(interp, 20_000);
    // Never finished within the cap => the worker's runaway guard force-terminates it.
    expect(res.done).toBe(false);
    expect(res.steps).toBe(20_000);
  });
});

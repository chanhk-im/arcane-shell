// Main-thread controller for the script Worker. Owns the Worker + shared
// channel, answers the worker's synchronous API requests by dispatching to the
// authoritative stores/combat engine, and enforces a hard-kill watchdog on stop
// (so even a no-sleep infinite loop is guaranteed killable).
//
// The whitelist here is the ONLY surface the sandbox can reach — never the full
// store (CLAUDE.md §3).

import {
  createChannel,
  CTRL_FLAG,
  CTRL_REQ_LEN,
  CTRL_RESP_LEN,
  REQ_SEP,
  type WorkerOutbound,
} from './protocol';
import { SCRIPT_HARD_KILL_MS, SCRIPT_MEMORY_PER_RUN } from '../constants';
import { performCast } from '../combatEngine';
import { getSkill, ALL_SKILLS } from '../data/skills';
import { currentTargetInfo, listTargets, applySelector } from '../targeting';
import { usePlayerStore, selectMaxMana, selectManaRegenPerSec } from '../../stores/usePlayerStore';
import { useCombatStore } from '../../stores/useCombatStore';
import { useScriptStore } from '../../stores/useScriptStore';
import type { SpellInfo } from '../../types/Skill';
import type { ActiveBuff, ScriptError } from '../../types/ScriptTypes';

function toSpellInfo(id: string): SpellInfo | null {
  const s = getSkill(id);
  if (!s) return null;
  return {
    id: s.id,
    element: s.element,
    grade: s.grade,
    type: s.type,
    manaCost: s.manaCost,
    cooldown: s.cooldown,
    duration: s.duration,
  };
}

function manaCostOf(id: string): number {
  const skill = getSkill(id);
  if (!skill) return Infinity;
  const player = usePlayerStore.getState();
  const maxMana = selectMaxMana(player);
  let pct = skill.manaCost;
  if (skill.type === '딜' && (useCombatStore.getState().activeBuffs['overload_buff'] ?? 0) > 0) {
    pct += 5;
  }
  return maxMana * (pct / 100);
}

// Dispatches one whitelisted API call. Returns { v } on success, { e } on a
// (script-catchable or fatal) error.
function dispatch(method: string, arg: unknown): { v?: unknown; e?: ScriptError } {
  const player = usePlayerStore.getState();
  const combat = useCombatStore.getState();
  const script = useScriptStore.getState();

  switch (method) {
    case 'cast': {
      const a = arg as { spellId: string };
      try {
        const result = performCast(a.spellId, null);
        return { v: result };
      } catch (err) {
        if (err && typeof err === 'object' && 'type' in err) {
          return { e: err as ScriptError };
        }
        const message = err instanceof Error ? err.message : String(err);
        // Fatal (non-catchable) — no `type`, so an uncaught throw terminates.
        return { e: { type: 'NoTarget', name: 'Error', message } as ScriptError };
      }
    }
    case 'isReady':
      return { v: (combat.cooldowns[String(arg)] ?? 0) <= 0 };
    case 'canAfford':
      return { v: player.mana >= manaCostOf(String(arg)) };
    case 'getSpells':
      return { v: ALL_SKILLS.map((s) => toSpellInfo(s.id)!).filter(Boolean) };
    case 'getSpellInfo': {
      const info = toSpellInfo(String(arg));
      return info ? { v: info } : { e: { type: 'NoTarget', name: 'Error', message: `unknown spell ${arg}` } };
    }
    case 'target.current':
      return { v: currentTargetInfo() };
    case 'target.set':
      return { v: applySelector(String(arg)) };
    case 'target.list':
      return { v: listTargets(Math.max(1, Math.min(20, Number(arg) || 5))) };
    case 'self.buffs': {
      const buffs: ActiveBuff[] = Object.entries(combat.activeBuffs).map(([spellId, remaining]) => ({
        spellId,
        remaining,
      }));
      return { v: buffs };
    }
    case 'mana.current':
      return { v: player.mana };
    case 'mana.max':
      return { v: selectMaxMana(player) };
    case 'mana.regenRate':
      return { v: selectManaRegenPerSec(player) };
    case 'resource.get': {
      const t = String(arg);
      if (t === 'gold') return { v: player.gold };
      if (t === 'fame') return { v: player.fame };
      if (t === 'bossmaterial') return { v: player.bossMaterial };
      return { v: 0 };
    }
    case 'resource.manaStone':
      return { v: player.manaStones[Number(arg)] ?? 0 };
    case 'resource.manaStoneAll':
      return { v: { ...player.manaStones } };
    case 'system.memoryUsed':
      return { v: script.memoryUsed };
    case 'system.memoryMax':
      return { v: script.memoryMax };
    default:
      return { e: { type: 'NoTarget', name: 'Error', message: `unknown api ${method}` } };
  }
}

class ScriptHost {
  private worker: Worker | null = null;
  private control: Int32Array | null = null;
  private data: Uint8Array | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private hardKillTimer: ReturnType<typeof setTimeout> | null = null;

  isSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined' && self.crossOriginIsolated === true;
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    this.worker = new Worker(new URL('./scriptWorker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<WorkerOutbound>) => this.onMessage(e.data);
    return this.worker;
  }

  private onMessage(msg: WorkerOutbound): void {
    const script = useScriptStore.getState();
    switch (msg.kind) {
      case 'api':
        this.answerApi();
        break;
      case 'log':
        script.appendConsole(msg.line);
        break;
      case 'started':
        script.appendConsole('[script started]');
        break;
      case 'finished':
        script.appendConsole('[script finished]');
        this.finish();
        break;
      case 'terminated':
        script.appendConsole(`[script terminated] ${msg.reason}`);
        useCombatStore.getState().appendLog(`script terminated: ${msg.reason}`, 'script');
        this.finish();
        break;
      case 'heartbeat':
        break;
    }
  }

  private answerApi(): void {
    if (!this.control || !this.data) return;
    const reqLen = Atomics.load(this.control, CTRL_REQ_LEN);
    // TextDecoder.decode() rejects any ArrayBufferView backed by a
    // SharedArrayBuffer (browsers disallow decoding memory another thread
    // could mutate mid-read) — .slice() copies into a fresh, non-shared
    // buffer first; .subarray() would still be a shared view and throw.
    const payload = this.decoder.decode(this.data.slice(0, reqLen));
    const sep = payload.indexOf(REQ_SEP);
    const method = sep >= 0 ? payload.slice(0, sep) : payload;
    const argJson = sep >= 0 ? payload.slice(sep + 1) : 'null';
    let arg: unknown = null;
    try {
      arg = JSON.parse(argJson);
    } catch {
      arg = null;
    }
    let response: { v?: unknown; e?: ScriptError };
    try {
      response = dispatch(method, arg);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      response = { e: { type: 'NoTarget', name: 'Error', message } };
    }
    const bytes = this.encoder.encode(JSON.stringify(response));
    this.data.set(bytes, 0);
    Atomics.store(this.control, CTRL_RESP_LEN, bytes.length);
    Atomics.store(this.control, CTRL_FLAG, 1);
    Atomics.notify(this.control, CTRL_FLAG);
  }

  private finish(): void {
    if (this.hardKillTimer) {
      clearTimeout(this.hardKillTimer);
      this.hardKillTimer = null;
    }
    const script = useScriptStore.getState();
    script.setRunning(false);
    script.setMemoryUsed(0);
  }

  start(source: string): boolean {
    if (!this.isSupported()) {
      useScriptStore
        .getState()
        .appendConsole('[error] SharedArrayBuffer unavailable (need cross-origin isolation). Restart dev server.');
      return false;
    }
    // Fresh worker + channel per run for a clean interpreter state.
    this.terminateWorker();
    const channel = createChannel();
    this.control = new Int32Array(channel.control);
    this.data = new Uint8Array(channel.data);
    const worker = this.ensureWorker();
    const script = useScriptStore.getState();
    script.setRunning(true);
    script.setMemoryUsed(SCRIPT_MEMORY_PER_RUN);
    worker.postMessage({ kind: 'run', source, channel });
    return true;
  }

  stop(): void {
    if (!this.worker) {
      this.finish();
      return;
    }
    this.worker.postMessage({ kind: 'stop' });
    // Watchdog: if the worker doesn't acknowledge in time (e.g. wedged), kill it.
    if (this.hardKillTimer) clearTimeout(this.hardKillTimer);
    this.hardKillTimer = setTimeout(() => {
      useScriptStore.getState().appendConsole('[script hard-killed] worker did not stop in time');
      this.terminateWorker();
      this.finish();
    }, SCRIPT_HARD_KILL_MS);
  }

  private terminateWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const scriptHost = new ScriptHost();

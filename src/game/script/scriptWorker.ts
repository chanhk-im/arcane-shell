/// <reference lib="webworker" />
// Script sandbox Worker (CLAUDE.md §3). Runs user code through JS-Interpreter,
// an AST-walking interpreter that never calls eval/new Function. Only the
// whitelisted API prelude is exposed; the stores are NOT reachable from here.
//
// Enforcement:
//  - a no-sleep runaway loop trips the step budget / busy-time guard and is
//    force-terminated;
//  - the worker yields to its own event loop every STEPS_PER_MACROTASK steps so
//    a 'stop' message lands promptly;
//  - any uncaught error (e.g. unknown skill id) terminates the script.

import Interpreter from 'js-interpreter';
import { API_PRELUDE } from './prelude';
import {
  CTRL_FLAG,
  CTRL_REQ_LEN,
  CTRL_RESP_LEN,
  CTRL_SLEEP,
  REQ_SEP,
  type SharedChannel,
  type WorkerInbound,
  type WorkerOutbound,
} from './protocol';
import {
  SCRIPT_RUNAWAY_STEP_BUDGET,
  SCRIPT_RUNAWAY_BUSY_MS,
  SCRIPT_STEPS_PER_MACROTASK,
} from '../constants';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let control: Int32Array | null = null;
let data: Uint8Array | null = null;
let interpreter: Interpreter | null = null;
let stopped = false;
let stepsSinceSleep = 0;
let busySince = 0;

function post(msg: WorkerOutbound): void {
  ctx.postMessage(msg);
}

// Synchronous request/response to the main thread via the shared buffer.
function callMain(method: string, argJson: string): string {
  if (!control || !data) return JSON.stringify({ e: { type: 'NoTarget', name: 'Error', message: 'no channel' } });
  const payload = method + REQ_SEP + argJson;
  const bytes = encoder.encode(payload);
  data.set(bytes, 0);
  Atomics.store(control, CTRL_REQ_LEN, bytes.length);
  Atomics.store(control, CTRL_FLAG, 0);
  post({ kind: 'api' });
  // Block this worker thread until the main thread flips CTRL_FLAG to 1.
  Atomics.wait(control, CTRL_FLAG, 0);
  const respLen = Atomics.load(control, CTRL_RESP_LEN);
  // See scriptHost.ts's answerApi(): TextDecoder.decode() rejects a
  // SharedArrayBuffer-backed view, so copy out via .slice() first.
  return decoder.decode(data.slice(0, respLen));
}

// A real sleep: parks the worker thread up to `ms` (no busy spin) and resets the
// runaway counters so a loop that sleeps each iteration is never terminated.
function nativeSleep(ms: number): void {
  const dur = Math.max(0, Math.min(60_000, Number.isFinite(ms) ? ms : 0));
  if (control && dur > 0) Atomics.wait(control, CTRL_SLEEP, 0, dur);
  stepsSinceSleep = 0;
  busySince = Date.now();
}

function initApi(interp: Interpreter, globalObject: unknown): void {
  interp.setProperty(
    globalObject,
    '__call',
    interp.createNativeFunction((methodP: unknown, argJsonP: unknown) => {
      const method = String(methodP);
      const argJson = argJsonP == null ? 'null' : String(argJsonP);
      return callMain(method, argJson);
    }),
  );
  interp.setProperty(
    globalObject,
    '__log',
    interp.createNativeFunction((lineP: unknown) => {
      post({ kind: 'log', line: String(lineP) });
      return undefined;
    }),
  );
  interp.setProperty(
    globalObject,
    'sleep',
    interp.createNativeFunction((msP: unknown) => {
      nativeSleep(Number(msP));
      return undefined;
    }),
  );
}

function cleanup(): void {
  interpreter = null;
  stopped = true;
}

function runSlice(): void {
  if (stopped || !interpreter) return;
  let stepsThisMacrotask = 0;
  try {
    for (;;) {
      const more = interpreter.step();
      if (!more) {
        post({ kind: 'finished' });
        cleanup();
        return;
      }
      stepsThisMacrotask += 1;
      stepsSinceSleep += 1;

      if (stepsSinceSleep > SCRIPT_RUNAWAY_STEP_BUDGET) {
        post({ kind: 'terminated', reason: 'runaway loop: step budget exceeded without sleep()' });
        cleanup();
        return;
      }
      if (Date.now() - busySince > SCRIPT_RUNAWAY_BUSY_MS) {
        post({ kind: 'terminated', reason: 'runaway loop: busy too long without sleep()' });
        cleanup();
        return;
      }
      if (stepsThisMacrotask >= SCRIPT_STEPS_PER_MACROTASK) {
        // Yield so a pending 'stop' message can be processed, then resume.
        setTimeout(runSlice, 0);
        return;
      }
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    post({ kind: 'terminated', reason: `uncaught error: ${reason}` });
    cleanup();
  }
}

function start(source: string, channel: SharedChannel): void {
  control = new Int32Array(channel.control);
  data = new Uint8Array(channel.data);
  stopped = false;
  stepsSinceSleep = 0;
  busySince = Date.now();
  try {
    interpreter = new Interpreter(`${API_PRELUDE}\n${source}`, initApi);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    post({ kind: 'terminated', reason: `parse error: ${reason}` });
    return;
  }
  post({ kind: 'started' });
  runSlice();
}

ctx.onmessage = (e: MessageEvent<WorkerInbound>) => {
  const msg = e.data;
  if (msg.kind === 'run') {
    start(msg.source, msg.channel);
  } else if (msg.kind === 'stop') {
    if (interpreter) {
      cleanup();
      post({ kind: 'terminated', reason: 'stopped by user' });
    } else {
      stopped = true;
    }
  }
};

// Shared wire protocol between the script Worker and the main thread.
//
// The Worker runs an AST-walking JS interpreter (no eval/new Function). Script
// API reads (mana.current, target.current, ...) and actions (cast) must be
// SYNCHRONOUS per script_api.md section 0, but the authoritative game state
// lives in the main-thread stores. We bridge that with a SharedArrayBuffer +
// Atomics: the worker writes a request, nudges the main thread via postMessage,
// then Atomics.wait()s until the main thread writes the response and notifies.
// The main thread never blocks. Requires cross-origin isolation (COOP/COEP
// headers, set in vite.config.ts) so SharedArrayBuffer is available.

// Control Int32Array slots.
export const CTRL_FLAG = 0; // 0 = waiting, 1 = response ready
export const CTRL_REQ_LEN = 1; // request byte length
export const CTRL_RESP_LEN = 2; // response byte length
export const CTRL_SLEEP = 3; // Atomics.wait target for sleep()
export const CTRL_SIZE = 4; // number of Int32 slots

export const DATA_BYTES = 128 * 1024; // 128 KB request/response scratch

// Separator between method name and arg-json inside a request payload
// (a NUL char, which cannot appear in a method name).
export const REQ_SEP = String.fromCharCode(0);

export interface SharedChannel {
  control: SharedArrayBuffer;
  data: SharedArrayBuffer;
}

export function createChannel(): SharedChannel {
  return {
    control: new SharedArrayBuffer(CTRL_SIZE * Int32Array.BYTES_PER_ELEMENT),
    data: new SharedArrayBuffer(DATA_BYTES),
  };
}

// Messages Worker -> main.
export type WorkerOutbound =
  | { kind: 'api' } // nudge: a request is waiting in the SAB
  | { kind: 'log'; line: string }
  | { kind: 'started' }
  | { kind: 'finished' } // script ran to completion
  | { kind: 'terminated'; reason: string } // step/time budget or fatal error
  | { kind: 'heartbeat' };

// Messages main -> Worker.
export type WorkerInbound =
  | { kind: 'run'; source: string; channel: SharedChannel }
  | { kind: 'stop' };

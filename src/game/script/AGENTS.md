<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-07-13 | Updated: 2026-07-13 -->

# script

## Purpose
The user-script automation sandbox (CLAUDE.md §3): runs player-authored JavaScript in a **real Web Worker** through an AST-walking interpreter (`js-interpreter` — never `eval`/`new Function`), exposing only a whitelisted API. This is the most security/safety-sensitive directory in the repo — a naive change here can either let a script touch the real store or let a runaway script hang the UI.

## Key Files
| File | Description |
|------|-------------|
| `prelude.ts` | `API_PRELUDE` — a string of interpreted-JS injected before user code, defining `cast()`, `isReady()`, `canAfford()`, `getSpells()`, `getSpellInfo()`, `target.*`, `self.buffs()`, `mana.*`, `resource.*`, `system.*`, `log()`. Every method here is backed by exactly 3 native functions the worker injects (`__call`, `__log`, `sleep`) — this is the **entire** surface area user code can reach. |
| `protocol.ts` | Shared wire protocol between the Worker and main thread. Script API calls must be synchronous (per `script_api.md` §0) but authoritative state lives on the main thread, so this bridges via a `SharedArrayBuffer` + `Atomics`: the worker writes a request, notifies via `postMessage`, then `Atomics.wait()`s (blocking only the worker thread) until the main thread responds. Requires cross-origin isolation (COOP/COEP — set in `vite.config.ts`). Also defines `WorkerInbound`/`WorkerOutbound` message types. |
| `scriptHost.ts` | Main-thread controller. Owns the `Worker` + shared channel, answers synchronous API requests via a `dispatch(method, arg)` switch that's **the actual whitelist enforcement point** — every case forwards to a specific store getter or `performCast`, nothing more. Also enforces a hard-kill watchdog on `stop()` (`SCRIPT_HARD_KILL_MS`) so even a wedged/no-sleep script is guaranteed killable — `terminate()`s and drops the worker if it doesn't ack in time. |
| `scriptWorker.ts` | The Worker entry point. Builds the interpreter from `API_PRELUDE + userSource`, steps it in slices, and enforces the runaway guards: `SCRIPT_RUNAWAY_STEP_BUDGET` (steps without an intervening `sleep()`), `SCRIPT_RUNAWAY_BUSY_MS` (continuous busy time), yielding every `SCRIPT_STEPS_PER_MACROTASK` steps so a `stop` message can land promptly. `nativeSleep()` does a real `Atomics.wait` park (no busy-spin) and resets the runaway counters. |
| `sandbox.test.ts` | Tests the interpreter + prelude semantics directly (normal completion, catchable `InsufficientMana`, fatal unknown-skill throw, runaway-loop non-termination within a step cap) using an in-process fake `__call` bridge — doesn't need a browser, unlike the real Worker+SAB transport. |

## For AI Agents

### Working In This Directory
- **Never** widen the whitelist by exposing a store or a raw function to the interpreter — every new script capability must be added as (a) a case in `scriptHost.ts`'s `dispatch()`, (b) a wrapper function in `prelude.ts`'s `API_PRELUDE` string, and (c) usually a new/extended `ScriptCommand` variant in `types/ScriptTypes.ts`. Adding only one of these breaks the sandbox contract silently.
- Errors surfaced to scripts must be one of the 3 typed `ScriptErrorType`s (`InsufficientMana`, `Cooldown`, `NoTarget`) to be catchable — anything else should be a fatal, uncaught throw (intentional; see `prelude.ts`'s `__invoke`, which logs fatal messages before throwing since the interpreter boundary otherwise swallows the message).
- If you touch the runaway-guard constants in `game/constants.ts` (`SCRIPT_RUNAWAY_STEP_BUDGET`, `SCRIPT_RUNAWAY_BUSY_MS`, `SCRIPT_STEPS_PER_MACROTASK`, `SCRIPT_HARD_KILL_MS`), re-run `sandbox.test.ts`'s runaway-loop test and manually verify Stop still works promptly in the browser — these are the only thing standing between a bad script and a frozen tab.
- The Worker + `SharedArrayBuffer` transport only works with COOP/COEP headers present (`vite.config.ts` sets them for dev/preview) — `scriptHost.isSupported()` gates on `crossOriginIsolated`; don't remove that check.

### Testing Requirements
- `npm test` runs `sandbox.test.ts` (interpreter semantics, no browser needed). The Worker/SAB transport itself (`scriptHost.ts`, `scriptWorker.ts`) is not unit-tested — verify changes there by running `npm run dev` and actually running/stopping a script in the Script tab, including a deliberately no-sleep infinite loop to confirm the runaway guard fires.

### Common Patterns
- Every `dispatch()` case returns `{ v } | { e }`, never throws directly across the JSON boundary — errors are always serialized, not thrown, until `prelude.ts`'s `__invoke` re-throws them inside the interpreter.

## Dependencies

### Internal
- `../combatEngine.ts` (`performCast`), `../data/skills.ts`, `../targeting.ts`, `../../stores/usePlayerStore.ts`, `../../stores/useCombatStore.ts`, `../../stores/useScriptStore.ts`, `../../types/ScriptTypes.ts`, `../../types/Skill.ts`, `../constants.ts`

### External
- `js-interpreter` (typed via `../../types/js-interpreter.d.ts`)
- Browser `Worker`, `SharedArrayBuffer`, `Atomics` (requires COOP/COEP from `vite.config.ts`)

<!-- MANUAL: -->

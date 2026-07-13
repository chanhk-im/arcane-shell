// Script editor hooks: source/console/running state + start/stop wired to the
// Worker host. The Worker is an external system, so start/stop belongs in an
// effect boundary (the caller invokes these handlers from events).

import { useShallow } from 'zustand/react/shallow';
import { useScriptStore } from '../stores/useScriptStore';
import { scriptHost } from '../game/script/scriptHost';

export interface ScriptRunnerState {
  source: string;
  running: boolean;
  consoleOutput: string[];
  memoryUsed: number;
  memoryMax: number;
  supported: boolean;
}

export function useScriptRunner(): ScriptRunnerState {
  const state = useScriptStore(
    useShallow((s) => ({
      source: s.source,
      running: s.running,
      consoleOutput: s.consoleOutput,
      memoryUsed: s.memoryUsed,
      memoryMax: s.memoryMax,
    })),
  );
  return { ...state, supported: scriptHost.isSupported() };
}

export function useScriptActions() {
  const setSource = useScriptStore((s) => s.setSource);
  const clearConsole = useScriptStore((s) => s.clearConsole);
  return {
    setSource,
    clearConsole,
    run: (source: string) => scriptHost.start(source),
    stop: () => scriptHost.stop(),
  };
}

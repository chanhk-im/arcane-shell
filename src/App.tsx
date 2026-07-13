import { useEffect, useState } from 'react';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import CommandInput from './components/CommandInput';
import TargetPanel from './components/combat/TargetPanel';
import SkillBar from './components/combat/SkillBar';
import CombatLogPanel from './components/combat/CombatLogPanel';
import { useUIStore } from './stores/useUIStore';
import { startGameLoop, stopGameLoop } from './game/loop/gameLoop';
import { computeOfflineProgress, applyOfflineProgress } from './game/loop/offline';
import type { OfflineSummary } from './game/loop/offline';
import { usePlayerStore } from './stores/usePlayerStore';
import { formatInt } from './game/formulas/formatNumber';

// Shell layout per docs/arcane_shell_ui_spec.md §1:
//   topbar (fixed) / [terminal 60%+ width | side-panel tabs] / command input.
export default function App() {
  const [offline, setOffline] = useState<OfflineSummary | null>(null);
  const lockedNotice = useUIStore((s) => s.lockedNotice);
  const clearNotice = useUIStore((s) => s.clearNotice);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  // External-system sync (CLAUDE.md §1-4): the tick loop lives outside React;
  // we only start/stop it here. Offline progress is computed once on load.
  useEffect(() => {
    const summary = computeOfflineProgress();
    if (summary && (summary.kills > 0 || summary.manaStones > 0)) {
      applyOfflineProgress(summary);
      setOffline(summary);
    } else {
      usePlayerStore.getState().touchLastSeen();
    }

    startGameLoop();
    const onBeforeUnload = () => usePlayerStore.getState().touchLastSeen();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      usePlayerStore.getState().touchLastSeen();
      stopGameLoop();
    };
  }, []);

  // F1 = context help (ui_spec §3-13). Full per-screen anchor mapping is out
  // of scope this milestone; F1 opens the 도움말 tab from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('help');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setActiveTab]);

  return (
    <div className="shell">
      <div className="shell-top">
        <TopBar />
        {offline && (
          <div className="notice" onClick={() => setOffline(null)}>
            오프라인 정산: {Math.round(offline.seconds / 60)}분 동안 약 {formatInt(offline.kills)}킬,
            +{formatInt(offline.manaStones)} 마석(등급{offline.grade}) 획득
            {offline.cappedTo24h ? ' (24시간 상한 적용)' : ''} — 클릭하여 닫기
          </div>
        )}
        {lockedNotice && (
          <div className="notice" onClick={clearNotice}>
            {lockedNotice} — 클릭하여 닫기
          </div>
        )}
      </div>

      <div className="shell-body">
        <div className="terminal-col">
          <div className="control-row">
            <TargetPanel />
            <SkillBar />
          </div>
          <CombatLogPanel />
        </div>
        <SidePanel />
      </div>

      <CommandInput />
    </div>
  );
}

import { useUIStore } from '../stores/useUIStore';
import type { TabId } from '../stores/useUIStore';
import StatsPanel from './combat/StatsPanel';
import TreeView from './TreeView';
import ScriptView from './ScriptView';
import MonsterDexPanel from './panels/MonsterDexPanel';
import DocsPanel from './panels/DocsPanel';
import HelpPanel from './panels/HelpPanel';

interface TabDef {
  id: TabId;
  label: string;
  locked: boolean;
  noticeLabel?: string; // shown in the "coming soon" toast; original NavShell wording
}

// Tab order follows ui_spec §1's ASCII layout ([트리|부품|룬|유물|도감|스크립트|
// 길드|경매장|균열|문서|도움말]), with 상태 prepended (wizard stat detail has no
// dedicated §3 screen) and the pre-existing locked entries (길드 레이드/AI 도제/
// 재귀 컴파일 — carried over from the previous nav so they aren't dropped)
// appended just before the always-open 문서/도움말 pair.
const TABS: TabDef[] = [
  { id: 'status', label: '상태', locked: false },
  { id: 'tree', label: '트리', locked: false },
  { id: 'parts', label: '부품', locked: true, noticeLabel: '부품 정비소' },
  { id: 'runes', label: '룬', locked: true, noticeLabel: '룬 각인' },
  { id: 'relics', label: '유물', locked: true, noticeLabel: '유물 시스템' },
  { id: 'dex', label: '도감', locked: false },
  { id: 'script', label: '스크립트', locked: false },
  { id: 'guild', label: '길드', locked: true, noticeLabel: '마법 길드' },
  { id: 'auction', label: '경매장', locked: true, noticeLabel: '경매장' },
  { id: 'rift', label: '균열', locked: true, noticeLabel: '차원 균열' },
  { id: 'raid', label: '길드 레이드', locked: true, noticeLabel: '길드 레이드' },
  { id: 'apprentice', label: 'AI 도제', locked: true, noticeLabel: 'AI 도제' },
  { id: 'recompile', label: '재귀 컴파일', locked: true, noticeLabel: '재귀 컴파일' },
  { id: 'docs', label: '문서', locked: false },
  { id: 'help', label: '도움말', locked: false },
];

export default function SidePanel() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const showLockedNotice = useUIStore((s) => s.showLockedNotice);

  return (
    <div className="side-panel">
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${t.locked ? 'locked' : ''} ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => (t.locked ? showLockedNotice(t.noticeLabel ?? t.label) : setActiveTab(t.id))}
            title={t.locked ? '잠김 — 이후 마일스톤에서 해금' : undefined}
          >
            {t.locked ? '\u{1F512} ' : ''}
            {t.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab === 'tree' && <TreeView />}
        {activeTab === 'dex' && <MonsterDexPanel />}
        {activeTab === 'script' && <ScriptView />}
        {activeTab === 'docs' && <DocsPanel />}
        {activeTab === 'help' && <HelpPanel />}
        {activeTab === 'status' && <StatsPanel />}
      </div>
    </div>
  );
}

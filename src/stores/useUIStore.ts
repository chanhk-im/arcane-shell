// UI-only store (CLAUDE.md §2-1): modal / transient view state, kept fully
// separate from game state so save/load never touches UI. Not persisted.

import { create } from 'zustand';

// Side-panel tab ids (ui_spec.md §1/§3). Kept here (not in a game store) since
// tab selection is pure UI state.
export type TabId =
  | 'status'
  | 'tree'
  | 'parts'
  | 'runes'
  | 'relics'
  | 'dex'
  | 'script'
  | 'guild'
  | 'auction'
  | 'rift'
  | 'raid'
  | 'apprentice'
  | 'recompile'
  | 'docs'
  | 'help';

export interface UIState {
  lockedNotice: string | null; // shown when a locked feature is clicked
  showLockedNotice: (feature: string) => void;
  clearNotice: () => void;

  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // ui_spec.md §3-12: "에디터에 삽입" jumps to the script tab so the insert
  // is immediately visible.
  docsInsertRequest: string | null;
  requestDocsInsert: (snippet: string) => void;
  clearDocsInsertRequest: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  lockedNotice: null,
  showLockedNotice: (feature) =>
    set(() => ({ lockedNotice: `${feature} 은(는) 이후 마일스톤에서 열립니다 (coming soon).` })),
  clearNotice: () => set(() => ({ lockedNotice: null })),

  activeTab: 'status',
  setActiveTab: (tab) => set(() => ({ activeTab: tab })),

  docsInsertRequest: null,
  requestDocsInsert: (snippet) => set(() => ({ docsInsertRequest: snippet, activeTab: 'script' })),
  clearDocsInsertRequest: () => set(() => ({ docsInsertRequest: null })),
}));

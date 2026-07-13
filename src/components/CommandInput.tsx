import { useRef, useState } from 'react';
import { useCombatStore } from '../stores/useCombatStore';
import { manualCast } from '../game/combatEngine';
import { getDealSkills, getBuffSkills, getSkill } from '../game/data/skills';
import { MAX_TIER_MILESTONE_1 } from '../game/data/monsters';
import { HELP_ENTRIES, findHelpEntry } from '../game/helpContent';
import { formatNumber } from '../game/formulas/formatNumber';

// Command input line (ui_spec §4): every side-panel click action must also be
// reachable as a typed command. This milestone wires the three commands the
// spec calls out by name — spell / target set / help — plus Tab-complete and
// history navigation (terminal-standard).
const COMMANDS = ['spell', 'target', 'target set', 'help'];
const SPELL_IDS = [...getDealSkills(), ...getBuffSkills()].map((s) => s.id);

function run(raw: string): void {
  const combat = useCombatStore.getState();
  const trimmed = raw.trim();
  if (!trimmed) return;
  combat.appendLog(trimmed, 'cmd');

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];

  if (cmd === 'spell') {
    const id = parts[1];
    if (!id || !getSkill(id)) {
      combat.appendLog(`알 수 없는 스킬: ${id ?? '(없음)'}. 사용법: spell <skillId>`, 'error');
      return;
    }
    manualCast(id);
    return;
  }

  if (cmd === 'target' && !parts[1]) {
    const t = combat.target;
    if (!t) {
      combat.appendLog('현재 타겟 없음', 'system');
    } else {
      combat.appendLog(
        `현재 타겟: tier ${t.tier} · ${t.element} · HP ${formatNumber(t.currentHp)}/${formatNumber(t.maxHp)}`,
        'system',
      );
    }
    return;
  }

  if (cmd === 'target' && parts[1] === 'set') {
    const tier = Number(parts[2]);
    if (!Number.isInteger(tier) || tier < 1 || tier > MAX_TIER_MILESTONE_1) {
      combat.appendLog(`잘못된 티어: ${parts[2] ?? '(없음)'}. 사용법: target set <1-${MAX_TIER_MILESTONE_1}>`, 'error');
      return;
    }
    combat.selectTier(tier);
    combat.appendLog(`타겟 티어 ${tier} 설정`, 'system');
    return;
  }

  if (cmd === 'help') {
    const keyword = parts.slice(1).join(' ');
    if (!keyword) {
      combat.appendLog(
        `사용 가능한 도움말 항목: ${HELP_ENTRIES.map((e) => e.keywords[0]).join(', ')}`,
        'system',
      );
      return;
    }
    const entry = findHelpEntry(keyword);
    if (!entry) {
      combat.appendLog(`'${keyword}'에 대한 도움말이 없습니다. help 를 입력해 목록을 확인하세요.`, 'error');
      return;
    }
    combat.appendLog(`${entry.title} — ${entry.summary}`, 'system');
    return;
  }

  combat.appendLog(`알 수 없는 명령어: ${cmd}. 사용 가능: ${COMMANDS.join(', ')}`, 'error');
}

function autocomplete(value: string): string | null {
  const parts = value.split(/\s+/);
  if (parts.length === 1) {
    const match = COMMANDS.find((c) => c.startsWith(parts[0]) && c !== parts[0]);
    return match ?? null;
  }
  if (parts[0] === 'spell' && parts.length === 2) {
    const match = SPELL_IDS.find((id) => id.startsWith(parts[1]) && id !== parts[1]);
    return match ? `spell ${match}` : null;
  }
  return null;
}

export default function CommandInput() {
  const [value, setValue] = useState('');
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef<number>(-1);

  const submit = () => {
    if (!value.trim()) return;
    run(value);
    historyRef.current.push(value);
    historyIdxRef.current = historyRef.current.length;
    setValue('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completed = autocomplete(value);
      if (completed) setValue(completed);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const h = historyRef.current;
      if (h.length === 0) return;
      historyIdxRef.current = Math.max(0, historyIdxRef.current - 1);
      setValue(h[historyIdxRef.current]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const h = historyRef.current;
      if (h.length === 0) return;
      historyIdxRef.current = Math.min(h.length, historyIdxRef.current + 1);
      setValue(h[historyIdxRef.current] ?? '');
    }
  };

  return (
    <div className="command-input-row">
      <span className="prompt">&gt;_</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="spell fire_1 · target set 3 · help crit"
        spellCheck={false}
        autoComplete="off"
      />
      <span className="hint">Tab 자동완성 · ↑↓ 기록</span>
    </div>
  );
}

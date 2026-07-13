import { useManaState, useResources } from '../hooks/usePlayer';
import { formatNumber, formatInt } from '../game/formulas/formatNumber';
import GradeBadge from './common/GradeBadge';

// Top bar (ui_spec §2): always-on mana gauge + mana-stone counts + gold/fame.
// Leaf-level subscriptions only (CLAUDE.md §2-2) — mana ticks every frame, so
// this stays the only component re-rendering on that cadence besides the log.
export default function TopBar() {
  const mana = useManaState();
  const res = useResources();

  const manaClass = mana.uptime < 0.6 ? 'mana-danger' : mana.uptime < 0.8 ? 'mana-warn' : 'mana-ok';
  const filled = Math.round(Math.max(0, mana.ratio) * 10);
  const asciiBar = `[${'█'.repeat(filled)}${'░'.repeat(10 - filled)}]`;

  return (
    <div className="topbar">
      <h1>ARCANE&nbsp;SHELL</h1>

      <div className="tb-mana">
        <span className="tb-mana-text">{asciiBar}</span>
        <div className={`bar ${manaClass}`}>
          <span className="mana" style={{ width: `${Math.max(0, mana.ratio * 100)}%` }} />
        </div>
        <span className="tb-mana-text">
          {formatNumber(mana.current)}/{formatNumber(mana.max)}
        </span>
      </div>

      <div className="tb-stones">
        {[1, 2, 3, 4, 5]
          .filter((g) => g <= res.grade)
          .map((g) => (
            <span key={g} className="tb-stone">
              <GradeBadge grade={g} />
              {formatInt(res.manaStones[g] ?? 0)}
            </span>
          ))}
      </div>

      <div className="tb-res">
        <span>
          골드 <b>{formatNumber(res.gold)}</b>
        </span>
        <span>
          명성 <b>{formatNumber(res.fame)}</b>
        </span>
      </div>
    </div>
  );
}

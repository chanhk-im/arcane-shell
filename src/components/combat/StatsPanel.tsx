import { useCoreStats, useManaState, useResources } from '../../hooks/usePlayer';
import { CORE_STAT_KEYS, CORE_STAT_LABEL } from '../../types/PlayerStats';
import {
  hitChance,
  critChance,
  atkSpeedMult,
  intMult,
} from '../../game/formulas/combat';
import { formatNumber, formatPercent } from '../../game/formulas/formatNumber';

// 마나 게이지·마석·골드·명성은 상단바(TopBar)가 이미 보여주므로(ui_spec §2)
// 여기서는 중복 없이 위저드 세부 스탯(파생치 포함)만 다룬다.
export default function StatsPanel() {
  const stats = useCoreStats();
  const mana = useManaState();
  const res = useResources();

  return (
    <div className="panel">
      <h2>Wizard</h2>
      <div className="stat-grid">
        {CORE_STAT_KEYS.map((k) => (
          <div key={k} style={{ display: 'contents' }}>
            <span className="k">{CORE_STAT_LABEL[k]}</span>
            <span className="v">{formatNumber(stats[k])}</span>
          </div>
        ))}
        <span className="k">지능배율</span>
        <span className="v">×{intMult(stats.intelligence).toFixed(2)}</span>
        <span className="k">명중</span>
        <span className="v">{formatPercent(hitChance(stats.agility), 1)}</span>
        <span className="k">크리</span>
        <span className="v">{formatPercent(critChance(stats.agility), 1)}</span>
        <span className="k">공속</span>
        <span className="v">×{atkSpeedMult(stats.agility).toFixed(2)}</span>
        <span className="k">가동률</span>
        <span className="v">{formatPercent(mana.uptime, 0)}</span>
      </div>

      <div className="stat-grid" style={{ marginTop: 10 }}>
        <span className="k">랭크 / 등급</span>
        <span className="v">
          R{res.rank} / G{res.grade}
        </span>
        <span className="k">마나 회복</span>
        <span className="v">{formatNumber(mana.regenPerSec)}/s</span>
      </div>
    </div>
  );
}

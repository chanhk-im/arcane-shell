import { useTargetInfo, useSelectedTier } from '../../hooks/useCombat';
import { useCombatStore } from '../../stores/useCombatStore';
import { formatNumber } from '../../game/formulas/formatNumber';
import { MAX_TIER_MILESTONE_1 } from '../../game/data/monsters';

const TIERS = Array.from({ length: MAX_TIER_MILESTONE_1 }, (_, i) => i + 1);

// Leaf component subscribing only to target + selected tier (CLAUDE.md §2-2).
export default function TargetPanel() {
  const target = useTargetInfo();
  const selectedTier = useSelectedTier();
  const selectTier = useCombatStore((s) => s.selectTier);

  const hpRatio = target && target.maxHp > 0 ? target.currentHp / target.maxHp : 0;

  return (
    <div className="panel">
      <h2>Target</h2>
      <div className="tier-tabs">
        {TIERS.map((t) => (
          <button
            key={t}
            className={t === selectedTier ? 'active' : ''}
            onClick={() => selectTier(t)}
          >
            T{t}
            {t === MAX_TIER_MILESTONE_1 ? ' (boss)' : ''}
          </button>
        ))}
      </div>

      {target ? (
        <>
          <div className="bar-label">
            <span>
              tier {target.tier} · {target.element}
              {target.isBoss ? ' · BOSS' : ''} · def {target.defense.toFixed(1)}
            </span>
            <span>
              {formatNumber(target.currentHp)} / {formatNumber(target.maxHp)} HP
            </span>
          </div>
          <div className="bar">
            <span className="hp" style={{ width: `${Math.max(0, hpRatio * 100)}%` }} />
          </div>
          <div className="pill" style={{ marginTop: 6 }}>
            마석 등급 {target.manaStoneGrade} 드랍
          </div>
        </>
      ) : (
        <div className="pill">no target</div>
      )}
    </div>
  );
}

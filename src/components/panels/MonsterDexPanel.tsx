import { ELEMENTS } from '../../types/Element';
import { MONSTERS, MAX_TIER_MILESTONE_1 } from '../../game/data/monsters';
import { formatNumber } from '../../game/formulas/formatNumber';
import ElementIcon from '../common/ElementIcon';
import GradeBadge from '../common/GradeBadge';

// 몬스터 도감 (ui_spec §3-5): 6속성 진행바 + 티어 아코디언, 읽기 전용 위키.
// "진행도"는 킬 카운트를 추적하지 않으므로(게임 로직에 없음) 실제로 검증 가능한
// 값 — 이번 마일스톤에 해금된 티어 수 / 해당 속성의 전체 티어 수 — 로 대체한다.
export default function MonsterDexPanel() {
  return (
    <div>
      <div className="pill" style={{ marginBottom: 10 }}>
        읽기 전용 몬스터 위키. 진행바는 해금된 티어 / 해당 속성 전체 티어 수를 나타냅니다.
      </div>
      {ELEMENTS.map((el) => {
        const tiers = MONSTERS.filter((m) => m.element === el).sort((a, b) => a.tier - b.tier);
        const unlocked = tiers.filter((m) => m.tier <= MAX_TIER_MILESTONE_1).length;
        const ratio = tiers.length > 0 ? unlocked / tiers.length : 0;
        const filled = Math.round(ratio * 10);
        return (
          <details key={el} className="dex-row">
            <summary>
              <ElementIcon element={el} /> [{'█'.repeat(filled)}
              {'░'.repeat(10 - filled)}] {unlocked}/{tiers.length}
            </summary>
            <div className="dex-tier-list">
              {tiers.map((m) => {
                const locked = m.tier > MAX_TIER_MILESTONE_1;
                return (
                  <div key={m.tier} className={`dex-tier ${locked ? 'locked' : ''}`}>
                    <span>
                      T{m.tier} {m.section}
                      {m.isBoss ? ' · BOSS' : ''} · <GradeBadge grade={m.manaStoneGrade} />
                    </span>
                    {locked ? (
                      <span>미해금</span>
                    ) : (
                      <span>
                        HP {formatNumber(m.hp)} · 방어 {m.defense.toFixed(1)} · 드랍{' '}
                        {m.dropMin}-{m.dropMax}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

import { getDealSkills, getBuffSkills } from '../../game/data/skills';
import { manualCast } from '../../game/combatEngine';
import { useCooldowns, useActiveBuffs } from '../../hooks/useCombat';

const DEAL = getDealSkills();
const BUFFS = getBuffSkills();

export default function SkillBar() {
  const cooldowns = useCooldowns();
  const activeBuffs = useActiveBuffs();

  return (
    <div className="panel">
      <h2>Cast</h2>
      <div className="btn-grid">
        {DEAL.map((s) => (
          <button key={s.id} className="skill-btn primary" onClick={() => manualCast(s.id)}>
            {s.label}
            <small>
              {s.element} · {s.manaCost}% mana
            </small>
          </button>
        ))}
      </div>

      <h2 style={{ marginTop: 14 }}>Buffs</h2>
      <div className="btn-grid">
        {BUFFS.map((s) => {
          const cd = cooldowns[s.id] ?? 0;
          const active = (activeBuffs[s.id] ?? 0) > 0;
          return (
            <button
              key={s.id}
              className="skill-btn"
              disabled={cd > 0}
              onClick={() => manualCast(s.id)}
            >
              {s.label} {active ? '●' : ''}
              <small>
                {cd > 0 ? `cd ${cd.toFixed(1)}s` : `${s.duration}s / ${s.cooldown}s · ${s.manaCost}%`}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

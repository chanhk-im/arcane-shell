import { useEffect, useRef } from 'react';
import { useCombatLog } from '../../hooks/useCombat';

export default function CombatLogPanel() {
  const log = useCombatLog();
  const ref = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest — DOM sync, so an effect is appropriate (CLAUDE.md §1-4).
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  return (
    <div className="panel log-panel">
      <h2>Terminal ({log.length}/200)</h2>
      <div className="log" ref={ref}>
        {log.map((entry) => (
          <div key={entry.id} className={`line ${entry.kind}`}>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}

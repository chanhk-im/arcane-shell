import { useTreeNodes, useBuyNode } from '../hooks/useTree';
import { useResources } from '../hooks/usePlayer';
import { formatNumber } from '../game/formulas/formatNumber';

// Arcana Tree view (route "/tree"). Simple per-depth list (graph layout is
// explicitly undecided in the docs — plan Step 8). Depths 1-10 functional;
// 11-55 shown locked.
export default function TreeView() {
  const nodes = useTreeNodes();
  const buyNode = useBuyNode();
  const res = useResources();

  return (
    <div>
      <div className="panel">
        <h2>Arcana Tree — 마석 등급1 {formatNumber(res.manaStones[1] ?? 0)}</h2>
        <div className="pill">
          깊이 1–10 (랭크1) 활성 · 11–55 잠금 (이후 마일스톤). 노드 강화 시 5대 스탯이 균등 상승합니다.
        </div>
      </div>

      <div className="tree-list">
        {nodes.map((n) => (
          <div
            key={n.depth}
            className={`tree-node ${n.locked ? 'locked' : ''} ${n.unlockLabel ? 'unlock' : ''}`}
          >
            <div className="depth">
              깊이 {n.depth}
              <br />
              <small>R{n.rank}·G{n.grade}</small>
            </div>
            <div className="meta">
              <span>
                {n.unlockLabel ? `해금: ${n.unlockLabel}` : `노드 ${n.depth}`}
                {n.unlockLabel ? <span className="badge">unlock ×1.5</span> : null}
              </span>
              <small>
                레벨 {n.level}/{n.maxLevel} · 스탯 +{n.perStatGain.toFixed(2)}/스탯
                {n.locked ? ' · 잠김' : n.maxed ? ' · 최대' : ` · 다음 ${formatNumber(n.nextCost)} 마석`}
              </small>
            </div>
            <button
              disabled={n.locked || n.maxed || !n.affordable}
              className={n.affordable ? 'primary' : ''}
              onClick={() => buyNode(n.depth)}
            >
              {n.locked ? '🔒' : n.maxed ? 'MAX' : n.level === 0 ? '해금' : '강화'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

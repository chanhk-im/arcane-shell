import { HELP_ENTRIES } from '../../game/helpContent';

// 도움말 (ui_spec §3-13) — 게임 시스템 자체에 대한 설명. 목차형 트리 구조
// 대신 카테고리 순서(전투 > 자원/트리)로 나열한 평면 리스트로 milestone 1
// 범위를 충당한다(11 항목이라 아코디언 없이도 스캔 가능).
export default function HelpPanel() {
  return (
    <div>
      <div className="pill" style={{ marginBottom: 10 }}>
        터미널에 <code>help</code> 또는 <code>help [키워드]</code>를 입력해도 같은 요약을 즉시 확인할 수 있습니다.
      </div>
      {HELP_ENTRIES.map((e) => (
        <div key={e.id} className="help-entry">
          <h3>{e.title}</h3>
          {e.detail.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

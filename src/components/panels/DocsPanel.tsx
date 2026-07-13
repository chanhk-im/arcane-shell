import { useState } from 'react';
import { useUIStore } from '../../stores/useUIStore';

// API 문서 (ui_spec §3-12) — 스크립트에 실제로 노출되는 API만 나열한다
// (game/script/prelude.ts의 화이트리스트 그대로, 존재하지 않는 함수는 적지 않음).
interface DocEntry {
  path: string;
  section: '전투 API' | '자원 API';
  signature: string;
  description: string;
  example: string;
}

const DOCS: DocEntry[] = [
  {
    path: 'combat/cast',
    section: '전투 API',
    signature: 'cast(spellId, target?)',
    description: '스킬을 시전합니다. 실패 시 Cooldown / InsufficientMana / NoTarget 중 하나를 throw합니다.',
    example: "cast('fire_1');",
  },
  {
    path: 'combat/isReady',
    section: '전투 API',
    signature: 'isReady(spellId): boolean',
    description: '버프 스킬의 쿨다운이 끝났는지 확인합니다.',
    example: "if (isReady('haste_buff')) cast('haste_buff');",
  },
  {
    path: 'combat/canAfford',
    section: '전투 API',
    signature: 'canAfford(spellId): boolean',
    description: '현재 마나로 해당 스킬을 시전할 수 있는지 확인합니다.',
    example: "if (canAfford('fire_1')) cast('fire_1');",
  },
  {
    path: 'combat/getSpells',
    section: '전투 API',
    signature: 'getSpells(): SpellInfo[]',
    description: '보유한 모든 스킬 정보를 배열로 반환합니다.',
    example: 'var spells = getSpells();',
  },
  {
    path: 'combat/getSpellInfo',
    section: '전투 API',
    signature: 'getSpellInfo(spellId): SpellInfo',
    description: '스킬 하나의 상세 정보(원소, 코스트, 계수 등)를 반환합니다.',
    example: "var info = getSpellInfo('fire_1');",
  },
  {
    path: 'combat/target.current',
    section: '전투 API',
    signature: 'target.current: TargetInfo | null',
    description: '현재 타겟 정보를 읽습니다.',
    example: 'var t = target.current;',
  },
  {
    path: 'combat/target.set',
    section: '전투 API',
    signature: 'target.set(selector)',
    description: '타겟을 선택합니다.',
    example: 'target.set(1);',
  },
  {
    path: 'combat/target.list',
    section: '전투 API',
    signature: 'target.list(count?): TargetInfo[]',
    description: '선택 가능한 타겟 목록을 최대 count개까지 반환합니다(기본 5).',
    example: 'var list = target.list(3);',
  },
  {
    path: 'combat/self.buffs',
    section: '전투 API',
    signature: 'self.buffs(): Record<string, number>',
    description: '현재 활성화된 버프와 남은 시간(초)을 반환합니다.',
    example: 'var buffs = self.buffs();',
  },
  {
    path: 'combat/mana.current',
    section: '전투 API',
    signature: 'mana.current: number',
    description: '현재 마나량을 읽습니다.',
    example: 'log(mana.current);',
  },
  {
    path: 'combat/mana.max',
    section: '전투 API',
    signature: 'mana.max: number',
    description: '최대 마나량을 읽습니다.',
    example: 'log(mana.max);',
  },
  {
    path: 'combat/mana.regenRate',
    section: '전투 API',
    signature: 'mana.regenRate: number',
    description: '초당 마나 회복량을 읽습니다.',
    example: 'log(mana.regenRate);',
  },
  {
    path: 'resource/resource.get',
    section: '자원 API',
    signature: "resource.get(type): number",
    description: '골드 등 자원 보유량을 조회합니다.',
    example: "resource.get('gold');",
  },
  {
    path: 'resource/resource.manaStone',
    section: '자원 API',
    signature: 'resource.manaStone(grade): number',
    description: '지정 등급 마석 보유량을 조회합니다.',
    example: 'resource.manaStone(1);',
  },
  {
    path: 'resource/resource.manaStoneAll',
    section: '자원 API',
    signature: 'resource.manaStoneAll(): Record<number, number>',
    description: '1~5등급 마석 보유량을 한 번에 조회합니다.',
    example: 'var stones = resource.manaStoneAll();',
  },
  {
    path: 'resource/system.memoryUsed',
    section: '자원 API',
    signature: 'system.memoryUsed: number',
    description: '스크립트가 현재 사용 중인 메모리(MB)를 읽습니다.',
    example: 'log(system.memoryUsed);',
  },
  {
    path: 'resource/system.memoryMax',
    section: '자원 API',
    signature: 'system.memoryMax: number',
    description: '스크립트에 허용된 메모리 상한(MB)을 읽습니다.',
    example: 'log(system.memoryMax);',
  },
  {
    path: 'resource/log',
    section: '자원 API',
    signature: 'log(msg)',
    description: '실행 로그 콘솔에 한 줄을 출력합니다.',
    example: "log('hp: ' + target.current.currentHp);",
  },
];

export default function DocsPanel() {
  const [selected, setSelected] = useState<string>(DOCS[0].path);
  const [query, setQuery] = useState('');
  const requestDocsInsert = useUIStore((s) => s.requestDocsInsert);

  const filtered = DOCS.filter(
    (d) => d.path.includes(query.toLowerCase()) || d.signature.toLowerCase().includes(query.toLowerCase()),
  );
  const active = DOCS.find((d) => d.path === selected) ?? DOCS[0];

  return (
    <div>
      <div className="doc-path">magic-hq.local/docs/{active.path}</div>
      <input
        placeholder="함수 검색..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          marginBottom: 8,
          background: '#080c0a',
          border: '1px solid var(--border)',
          borderRadius: 4,
          color: 'var(--fg)',
          padding: '4px 8px',
          fontFamily: 'var(--font)',
          fontSize: 12,
        }}
      />
      <div className="doc-layout">
        <div className="doc-list">
          {(['전투 API', '자원 API'] as const).map((section) => (
            <div key={section}>
              <div className="pill" style={{ margin: '4px 0' }}>
                {section}
              </div>
              {filtered
                .filter((d) => d.section === section)
                .map((d) => (
                  <button
                    key={d.path}
                    className={d.path === selected ? 'active' : ''}
                    onClick={() => setSelected(d.path)}
                  >
                    {d.signature.split('(')[0].split(':')[0]}
                  </button>
                ))}
            </div>
          ))}
        </div>
        <div className="doc-detail">
          <h3 style={{ margin: '0 0 4px', color: 'var(--accent)', fontSize: 13 }}>{active.signature}</h3>
          <p>{active.description}</p>
          <div className="doc-sig">{active.example}</div>
          <button className="small primary" onClick={() => requestDocsInsert(active.example)}>
            에디터에 삽입
          </button>
        </div>
      </div>
    </div>
  );
}

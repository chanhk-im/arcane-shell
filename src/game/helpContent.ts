// Game-concept help content (ui_spec §3-13) — distinct from the script API
// docs (§3-12). Every number here is transcribed straight from
// game/formulas/combat.ts and game/formulas/manaUptime.ts so it can never
// drift from the real formulas without this file being touched too.

export interface HelpEntry {
  id: string;
  keywords: string[]; // matched by `help <keyword>`
  title: string;
  summary: string; // one-line, used by the `help` terminal command
  detail: string[]; // paragraph lines, used by the side-panel HelpPanel
}

export const HELP_ENTRIES: HelpEntry[] = [
  {
    id: 'crit',
    keywords: ['crit', '크리', '크리티컬', '크리확률'],
    title: '전투 > 크리티컬 계산식',
    summary: '크리확률 = 5% + 75%×(민첩/(민첩+300)) — 민첩이 오를수록 80%에 수렴합니다.',
    detail: [
      '크리확률 = 5% + 75% × ( 민첩 / (민첩 + 300) )',
      '민첩이 무한히 커져도 크리확률은 80%를 넘지 않습니다(수렴 상한).',
      '집중(focus) 버프는 이 값에 +20%p를 더합니다(상한 80% 이후 초과분은 버려집니다).',
    ],
  },
  {
    id: 'hit',
    keywords: ['hit', '명중', '명중률'],
    title: '전투 > 명중률 계산식',
    summary: '명중률 = 90% + 9%×(민첩/(민첩+200)) — 99%에 수렴합니다.',
    detail: ['명중률 = 90% + 9% × ( 민첩 / (민첩 + 200) )', '민첩이 커질수록 99%에 가까워지되 도달하지 않습니다.'],
  },
  {
    id: 'atkspeed',
    keywords: ['atkspeed', '공속', '공격속도'],
    title: '전투 > 공격속도 계산식',
    summary: '공격속도배율 = 1 + 2×(민첩/(민첩+400)) — 최대 3배.',
    detail: ['공격속도배율 = 1 + 2 × ( 민첩 / (민첩 + 400) )', '민첩이 커질수록 3배(3x)에 수렴합니다.'],
  },
  {
    id: 'uptime',
    keywords: ['uptime', '가동률', '마나가동률'],
    title: '전투 > 마나 가동률',
    summary: '가동률 = MIN(1, 10% ÷ (5% × 공격속도배율)). 공속이 3배 상한에 가까워지면 약 67%에서 고정됩니다.',
    detail: [
      '가동률 = MIN( 1, 마나회복(초당 10%) ÷ (마나소모(회당 5%) × 공격속도배율) )',
      '공격속도가 3배 상한에 수렴하면 가동률도 약 67%에서 영구히 고정됩니다 — 그 이후로도 마나/마나회복 스탯이 유효하게 남는 장치입니다.',
      '가동률 79~60%: 상단바 마나 게이지 테두리 주황. 60% 미만: 빨강(설계상 하한이 67%라 실제로는 거의 발생하지 않습니다).',
    ],
  },
  {
    id: 'element',
    keywords: ['element', '속성', '상성'],
    title: '전투 > 속성 상성',
    summary: '4순환(화→수→뇌→지→화): 이기면 +25%, 지면 -25%. 성↔암은 서로 공격 시 항상 +25%.',
    detail: [
      '4순환: 화 → 수 → 뇌 → 지 → 화. 사이클 상 다음 속성을 공격하면 +25% 데미지, 반대로 당하면 -25%.',
      '성(빛)과 암(어둠)은 대립 속성으로, 서로를 공격할 때는 방향에 상관없이 항상 +25%.',
      '그 외 조합은 배율 보정 없음(1.0배).',
    ],
  },
  {
    id: 'defense',
    keywords: ['defense', '방어', '방어감쇠'],
    title: '전투 > 방어 감쇠',
    summary: '방어감쇠 = 100 / (100 + 방어력 - 방어관통).',
    detail: ['방어감쇠 = 100 / (100 + 방어력 - 방어관통)', '방어관통이 방어력을 넘으면 감쇠 없이 100% 데미지가 들어갑니다.'],
  },
  {
    id: 'intmult',
    keywords: ['int', '지능', '지능배율'],
    title: '전투 > 지능배율',
    summary: '지능배율 = 1 + 지능/100. 상한이 없어 후반부 데미지 성장의 핵심 축입니다.',
    detail: ['지능배율 = 1 + 지능 / 100', '다른 파생 스탯과 달리 수렴 상한이 없습니다 — 후반 지수적 성장의 근거입니다.'],
  },
  {
    id: 'tree',
    keywords: ['tree', '트리', '아르카나'],
    title: '아르카나 트리 구조',
    summary: '55깊이, 랭크 10개 구간(깊이 10마다 랭크 경계). 이번 마일스톤은 깊이 1~10만 해금됩니다.',
    detail: [
      '트리는 총 55깊이이며 랭크 1~10개 구간으로 나뉘어, 깊이 10마다 랭크 경계가 있습니다.',
      '노드를 강화하면 5대 스탯이 균등하게 상승합니다.',
      '이번 마일스톤에서는 깊이 1~10까지만 강화 가능하고, 11 이상은 다음 마일스톤에서 열립니다.',
    ],
  },
  {
    id: 'manastone',
    keywords: ['manastone', '마석', '등급'],
    title: '마석 등급',
    summary: '마석은 1~5등급이 있으며, 등급 팔레트(흰/초록/파랑/보라/주황금)를 마석·룬·부품·옵션 등급에 동일하게 재사용합니다.',
    detail: [
      '마석 등급 1~5는 흰색 → 초록 → 파랑 → 보라 → 주황/금색 순으로 색이 강해집니다.',
      '이 5단계 팔레트는 마석 등급, 룬 희귀도, 부품 등급, 옵션 등급에 전부 동일하게 재사용됩니다.',
      '현재 플레이어가 획득 가능한 등급(상단바 res.grade)까지만 상단바에 표시됩니다.',
    ],
  },
];

export function findHelpEntry(keyword: string): HelpEntry | undefined {
  const k = keyword.trim().toLowerCase();
  return HELP_ENTRIES.find((e) => e.keywords.some((kw) => kw.toLowerCase() === k));
}

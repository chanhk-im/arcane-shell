// Six-element system per master_spec.md §2-3 / content_design.md §1.
// 4-cycle: 화(fire) → 수(water) → 뇌(thunder) → 지(earth) → 화 (winner +25%, loser -25%)
// Opposed pair: 성(light) ↔ 암(dark) (each attacking the other always +25%)

export type Element = '화' | '수' | '뇌' | '지' | '성' | '암';

export const ELEMENTS: readonly Element[] = ['화', '수', '뇌', '지', '성', '암'];

// English identifiers used for skill ids / css classes.
export const ELEMENT_EN: Record<Element, string> = {
  화: 'fire',
  수: 'water',
  뇌: 'thunder',
  지: 'earth',
  성: 'light',
  암: 'dark',
};

// Skill command-style names per content_design.md §1 naming table.
export const ELEMENT_SKILL_VERB: Record<Element, string> = {
  화: 'ignite',
  수: 'flush',
  뇌: 'interrupt',
  지: 'commit',
  성: 'patch',
  암: 'exploit',
};

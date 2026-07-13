import type { Element } from '../../types/Element';

// 6속성 아이콘+색상 (ui_spec §5-3/§6).
const ELEMENT_COLOR: Record<Element, string> = {
  화: 'var(--el-fire)',
  수: 'var(--el-water)',
  뇌: 'var(--el-thunder)',
  지: 'var(--el-earth)',
  성: 'var(--el-light)',
  암: 'var(--el-dark)',
};

export default function ElementIcon({ element }: { element: Element }) {
  return (
    <span className="el-badge" style={{ color: ELEMENT_COLOR[element] }}>
      <span className="el-dot" style={{ background: ELEMENT_COLOR[element] }} />
      {element}
    </span>
  );
}

// 5단계 등급 팔레트 뱃지 — 마석/룬/부품/옵션 등급 공용 (ui_spec §5-4/§6).
const GRADE_COLOR: Record<number, string> = {
  1: 'var(--grade-1)',
  2: 'var(--grade-2)',
  3: 'var(--grade-3)',
  4: 'var(--grade-4)',
  5: 'var(--grade-5)',
};

export default function GradeBadge({ grade, label }: { grade: number; label?: string }) {
  const color = GRADE_COLOR[grade] ?? 'var(--fg-dim)';
  return (
    <span className="grade-badge" style={{ color }}>
      G{grade}
      {label ? ` ${label}` : ''}
    </span>
  );
}

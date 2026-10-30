/**
 * Conjunto de chips para listas cortas (áreas de interés, permisos, habilidades).
 */
export default function ChipList({ items = [], tone = 'neutral' }) {
  const classes = {
    neutral: 'bg-surface-alt text-ink-muted ring-1 ring-border',
    primary: 'bg-primary-soft text-primary',
    success: 'bg-success-soft text-success',
  }
  const chip = classes[tone] ?? classes.neutral
  if (items.length === 0) return <span className="t-caption">—</span>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <li key={index} className={`rounded-full px-3 py-1 text-[13px] font-medium leading-5 ${chip}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

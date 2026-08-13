/**
 * Conjunto de chips para listas cortas (áreas de interés, permisos, habilidades).
 * Cuadrados, 6px — nunca píldoras.
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
        <li key={index} className={`rounded-[6px] px-2 py-0.5 text-[11px] font-medium leading-4 ${chip}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

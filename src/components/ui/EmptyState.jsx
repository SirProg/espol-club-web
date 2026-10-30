import BrandMark from './BrandMark'

/**
 * Estado vacío — parte intencional del diseño (MASTER §13). El logo firma los estados vacíos y nunca una vista queda en blanco.
 */
export default function EmptyState({ message, hint, action, height = 40 }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <BrandMark height={height} />
      <p className="t-body text-ink-muted">{message}</p>
      {hint && <p className="t-caption">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

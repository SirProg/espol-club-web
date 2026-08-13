import { TONE_STRIPES } from './tones'

/**
 * Tarjeta del panel.
 *
 * La franja vertical de 4px ya no es color por club: es canal de estado
 * (statusTone: success / warning / danger / neutral). Si no hay estado, va en
 * neutral apenas perceptible.
 */
export default function Card({
  title,
  subtitle,
  description,
  right,
  tone = 'neutral',
  actions,
  children,
  className = '',
  header,
  as,
}) {
  const Tag = as ?? 'div'
  return (
    <Tag
      className={`relative overflow-hidden rounded-[10px] bg-surface shadow-card ring-1 ring-border ${className}`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${TONE_STRIPES[tone] ?? TONE_STRIPES.neutral}`} />
      {header ?? (title || subtitle || right ? (
        <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-2 md:px-5">
          <div className="min-w-0">
            {title && <h3 className="t-heading truncate">{title}</h3>}
            {subtitle && <p className="t-caption mt-0.5">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      ) : null)}
      {description && <p className="t-body px-4 md:px-5">{description}</p>}
      {children && <div className="px-4 py-3 md:px-5">{children}</div>}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 md:px-5">
          {actions}
        </div>
      )}
    </Tag>
  )
}

import { TONE_STRIPES } from './tones'

/**
 * Placa del panel.
 *
 * La franja vertical de 4px es canal de estado (statusTone: success / warning /
 * danger). Sin estado no hay franja: la placa se sostiene con su profundidad.
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
      className={`relative overflow-hidden rounded-lg bg-surface shadow-raised ${className}`}
    >
      {tone !== 'neutral' && (
        <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${TONE_STRIPES[tone] ?? ''}`} />
      )}
      {header ?? (title || subtitle || right ? (
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-2 md:px-6">
          <div className="min-w-0">
            {title && <h3 className="t-heading truncate">{title}</h3>}
            {subtitle && <p className="t-caption mt-0.5">{subtitle}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      ) : null)}
      {description && <p className="t-body px-5 md:px-6">{description}</p>}
      {children && <div className="px-5 py-3 pb-5 md:px-6">{children}</div>}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3 md:px-6">
          {actions}
        </div>
      )}
    </Tag>
  )
}

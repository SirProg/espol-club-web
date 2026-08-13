/**
 * Cabecera de pantalla: eyebrow + título + descripción.
 *
 * El eyebrow es el único uso frecuente del rojo: rectángulo sólido de
 * 14×3px en #C8102E + etiqueta en versalitas 10px con letter-spacing 1.1px.
 */
export default function SectionTitle({ eyebrow, title, description, hint, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
      <div>
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2">
            <span aria-hidden="true" className="h-[3px] w-3.5 bg-accent" />
            <span className="t-label">{eyebrow}</span>
          </div>
        )}
        <h1 className="t-title">{title}</h1>
        {description && <p className="t-body mt-1 text-ink-muted">{description}</p>}
      </div>
      {(hint || children) && (
        <div className="flex items-center gap-3">
          {hint && <span className="t-caption">{hint}</span>}
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Cabecera de pantalla: eyebrow + título + descripción, con la entrada de gran
 * formato de Club-search.
 */
export default function SectionTitle({ eyebrow, title, description, hint, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-[68ch]">
        {eyebrow && (
          <p className="t-label mb-2">{eyebrow}</p>
        )}
        <h1 className="t-title">{title}</h1>
        {description && <p className="mt-3 text-[1.1rem] leading-relaxed text-ink-muted">{description}</p>}
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

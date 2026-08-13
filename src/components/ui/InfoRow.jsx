/**
 * Par etiqueta/valor para paneles y tarjetas de detalle.
 * Los valores que son registros (matrícula, fechas, PAO) se marcan `mono`.
 */
export default function InfoRow({ label, value, mono, children }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="t-label shrink-0 sm:w-48">{label}</dt>
      <dd className={mono ? 't-data break-words text-left sm:text-right' : 't-body break-words text-left sm:text-right'}>
        {children ?? value ?? '—'}
      </dd>
    </div>
  )
}

import { useIsMobile } from '../../hooks/useIsDesktop'
import EmptyState from './EmptyState'
import { TONE_STRIPES } from './tones'

/**
 * Tabla del panel — plano, con scroll horizontal propio.
 *
 * Bajo 768px las filas se rinden como tarjetas (mismo patrón que la app Expo,
 * que no tiene componente Table): franja de estado a la izquierda y Badge a la
 * derecha, con las columnas como pares etiqueta/valor.
 *
 * Cada columna: { key, header, render?, mono?, className?, mobile? }.
 * `mobile: false` oculta la columna en la vista de tarjeta — es lo que se usa
 * para las columnas de acciones que la matriz de §4 difiere al escritorio.
 *
 * `mobileActions(row)` es la excepción: las acciones que la matriz **sí**
 * permite en móvil se pintan con esto, fuera del botón de la fila. Meterlas
 * dentro anidaría botones, que es HTML inválido y el navegador reescribe.
 */
export default function Table({
  columns,
  rows = [],
  rowKey = 'id',
  onRowClick,
  empty,
  headerExtra,
  mobileActions,
}) {
  const isMobile = useIsMobile()

  // MASTER §13: los estados vacíos son parte intencional del diseño. Sin este
  // respaldo, olvidar `empty` deja un hueco mudo en lugar de una explicación.
  if (rows.length === 0) {
    return <div className="py-2">{empty ?? <EmptyState message="No hay datos para mostrar." />}</div>
  }

  return (
    <div className="rounded-[10px] bg-surface shadow-card ring-1 ring-border">
      {headerExtra && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-5">
          {headerExtra}
        </div>
      )}
      {isMobile ? (
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const tone = row.__stripe ?? 'neutral'
            const visible = columns.filter((col) => col.mobile !== false)
            const actions = mobileActions?.(row)

            const content = (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {visible
                    .filter((col) => col.mobileMain)
                    .map((col) => (
                      <div key={col.key} className={`t-heading ${col.mobileMain}`}>
                        {(col.render ?? ((r) => r[col.key]))(row)}
                      </div>
                    ))}
                  {visible
                    .filter((col) => !col.mobileMain)
                    .map((col) => (
                      <div key={col.key} className="mt-2">
                        <span className="t-label mr-2">{col.mobileLabel ?? col.header}</span>
                        <span className={col.mono ? 't-data' : 't-body'}>
                          {(col.render ?? ((r) => r[col.key]))(row)}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="shrink-0">{row.__right}</div>
              </div>
            )

            return (
              <li key={row[rowKey]} className="relative pl-4">
                <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${TONE_STRIPES[tone]}`} />

                {onRowClick ? (
                  <button
                    type="button"
                    className="block w-full px-4 pt-4 pb-2 text-left"
                    onClick={() => onRowClick(row)}
                  >
                    {content}
                  </button>
                ) : (
                  <div className="px-4 pt-4 pb-2">{content}</div>
                )}

                {actions && <div className="flex flex-wrap gap-2 px-4 pb-4">{actions}</div>}
                {!actions && <div className="pb-2" />}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="scroll-x">
          <table className="w-full min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`t-label whitespace-nowrap px-4 py-3 md:px-5 ${col.className ?? ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr
                  key={row[rowKey]}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer hover:bg-surface-alt' : ''}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-middle md:px-5 ${col.mono ? 't-data' : ''} ${col.className ?? ''}`}
                    >
                      {(col.render ?? ((r) => r[col.key]))(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

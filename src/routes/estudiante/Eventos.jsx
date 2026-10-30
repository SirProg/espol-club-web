import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { events } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { ROUTES } from '../../routing/modules'
import { label } from '../../lib/enums'
import { fmtDateTime, plural } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Badge from '../../components/ui/Badge'
import FilterChips from '../../components/ui/FilterChips'
import EmptyState from '../../components/ui/EmptyState'

/**
 * Eventos disponibles (9) — V-04.
 *
 * Los `MembersOnly` se listan igual que los públicos y llevan su etiqueta: el
 * catálogo es de descubrimiento, y ocultarlos daría la impresión de que el club
 * no hace nada (RF-33). Quien no sea miembro verá el bloqueo al abrir el
 * detalle, con el mensaje que escribió el líder.
 */
export default function Eventos() {
  const fetcher = useCallback(() => events.list({ upcoming: 'true' }), [])
  const agenda = useApi(fetcher)

  const [filtro, setFiltro] = useState('todos')

  const opciones = [
    { value: 'todos', label: 'Todos' },
    { value: 'abiertos', label: 'Con inscripción abierta' },
    { value: 'publicos', label: 'Abiertos a todos' },
  ]

  const visibles = useMemo(() => {
    const lista = agenda.data ?? []
    if (filtro === 'abiertos') return lista.filter((e) => e.registration_is_open)
    if (filtro === 'publicos') return lista.filter((e) => e.visibility === 'Public')
    return lista
  }, [agenda.data, filtro])

  return (
    <>
      <SectionTitle
        eyebrow="Mi espacio"
        title="Eventos"
        description="Actividades próximas de los clubes de la ESPOL."
        hint={agenda.data ? plural(visibles.length, 'evento', 'eventos') : undefined}
      />

      <div className="mb-5">
        <FilterChips items={opciones} selected={filtro} onSelect={setFiltro} ariaLabel="Filtrar eventos" />
      </div>

      {agenda.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : agenda.error ? (
        <p className="text-sm text-danger">No se pudo cargar la cartelera.</p>
      ) : visibles.length === 0 ? (
        <EmptyState
          message="No hay eventos disponibles por ahora."
          hint="Cuando un club programe una actividad, aparecerá aquí."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((evento) => (
            <li key={evento.id}>
              <Link
                to={ROUTES.APP_EVENTO.replace(':eventId', evento.id)}
                className="relative flex h-full flex-col overflow-hidden rounded-lg bg-surface pl-4 shadow-raised transition-colors hover:ring-primary"
              >
                {/* La franja dice si aún puedes inscribirte. */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1 ${
                    evento.registration_is_open ? 'bg-success' : 'bg-hairline'
                  }`}
                />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="t-heading leading-tight">{evento.event_name}</p>
                    {evento.visibility === 'MembersOnly' && (
                      <Badge text="Solo miembros" tone="warning" />
                    )}
                  </div>

                  <p className="t-data mt-2">{evento.club_acronym}</p>

                  <dl className="mt-3 space-y-1.5">
                    <div className="flex gap-2">
                      <dt className="t-label w-14 shrink-0 pt-0.5">Cuándo</dt>
                      <dd className="t-body">{fmtDateTime(evento.start_datetime)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="t-label w-14 shrink-0 pt-0.5">Dónde</dt>
                      <dd className="t-body">{evento.planned_place || '—'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="t-label w-14 shrink-0 pt-0.5">Modo</dt>
                      <dd className="t-body">{evento.mode_label ?? label(evento.mode)}</dd>
                    </div>
                  </dl>
                </div>

                <p
                  className={`border-t border-border px-4 py-2.5 text-xs font-semibold ${
                    evento.registration_is_open ? 'text-success' : 'text-ink-faint'
                  }`}
                >
                  {evento.registration_is_open ? 'Inscripción abierta' : 'Inscripción cerrada'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

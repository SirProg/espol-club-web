import { useCallback, useState } from 'react'

import { events } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { fmtDateTime } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Field from '../../components/ui/Field'
import EmptyState from '../../components/ui/EmptyState'

const ATTENDANCE_TONES = {
  Registered: 'neutral',
  Attended: 'success',
  NoShow: 'danger',
}

const QR_TONES = {
  Active: 'success',
  Used: 'warning',
  Expired: 'neutral',
}

/**
 * Bitácora del club (34) — inscritos por evento (resuelve PPD-04).
 *
 * El evento va en la URL del endpoint; el selector de aquí es del cliente:
 * cambiar el evento vuelve a pedir la bitácora con sus respuestas de
 * formulario. Es una pantalla de consulta, así que funciona también en móvil.
 */
export default function Bitacora() {
  const { ledClubId } = useAuth()

  const eventsFetcher = useCallback(() => events.listByClub(ledClubId), [ledClubId])
  const eventList = useApi(eventsFetcher)

  // null = el usuario aún no eligió: se usa el primer evento del club.
  const [eventId, setEventId] = useState(null)
  const effectiveEventId = eventId ?? eventList.data?.[0]?.id ?? null

  const logFetcher = useCallback(() => {
    return effectiveEventId
      ? events.registrations(effectiveEventId, { responses: true })
      : Promise.resolve(null)
  }, [effectiveEventId])
  const log = useApi(logFetcher)

  const summary = log.data?.summary ?? {}
  const registrations = log.data?.registrations ?? []

  const summaryCards = [
    { label: 'Inscritos', value: summary.registered ?? 0, tone: 'primary' },
    { label: 'Asistieron', value: summary.attended ?? 0, tone: 'success' },
    { label: 'No asistieron', value: summary.no_show ?? 0, tone: 'danger' },
    { label: 'Pendientes', value: summary.pending ?? 0, tone: 'neutral' },
  ]

  const rows = registrations.map((registration) => ({
    ...registration,
    __stripe: ATTENDANCE_TONES[registration.attendance_status] ?? 'neutral',
    inscrito: (
      <div>
        <div className="t-body font-medium">{registration.full_name}</div>
        <div className="t-caption tabular-nums">{registration.enrollment}</div>
      </div>
    ),
    fecha: fmtDateTime(registration.registered_at),
    asistencia: (
      <Badge
        text={registration.attendance_status_label}
        tone={ATTENDANCE_TONES[registration.attendance_status] ?? 'neutral'}
      />
    ),
    credencial: <Badge text={registration.qr_status} tone={QR_TONES[registration.qr_status] ?? 'neutral'} />,
  }))

  const columns = [
    { key: 'inscrito', header: 'Inscrito', mobileMain: true },
    { key: 'faculty', header: 'Facultad', className: 'hidden lg:table-cell' },
    {
      key: 'fecha',
      header: 'Fecha de registro',
      mono: true,
      className: 'hidden md:table-cell',
    },
    { key: 'asistencia', header: 'Asistencia', render: (row) => row.asistencia },
    {
      key: 'credencial',
      header: 'Credencial',
      className: 'hidden md:table-cell',
      render: (row) => row.credencial,
    },
  ]

  return (
    <>
      <SectionTitle
        eyebrow="Gestión del club"
        title="Bitácora"
        description="Inscritos de cada evento, para pasar lista."
      />

      {eventList.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (eventList.data ?? []).length === 0 ? (
        <EmptyState
          message="Este club aún no ha creado eventos."
          hint="Cuando programes una actividad con formulario, aquí aparecerán sus inscritos."
        />
      ) : (
        <>
          <div className="mb-4 w-full max-w-sm">
            <Field
              label="Evento"
              name="event"
              className="gap-1"
              children={
                <select
                  name="event"
                  value={effectiveEventId ?? ''}
                  onChange={(event) => setEventId(Number(event.target.value))}
                  className="input"
                >
                  {(eventList.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.event_name}
                    </option>
                  ))}
                </select>
              }
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-lg bg-surface p-4 shadow-raised">
                <p className="t-caption">{card.label}</p>
                <p className="t-heading text-xl">{card.value}</p>
              </div>
            ))}
          </div>

          {log.loading ? (
            <p className="t-caption">Cargando…</p>
          ) : (
            <Table
              columns={columns}
              rows={rows}
              rowKey="id"
              empty={
                <EmptyState
                  message="No hay inscritos en este evento."
                  hint="Comparte el formulario de inscripción para que lleguen los primeros registros."
                />
              }
            />
          )}
        </>
      )}
    </>
  )
}

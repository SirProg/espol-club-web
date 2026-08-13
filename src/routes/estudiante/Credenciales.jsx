import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { profile } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { ROUTES } from '../../routing/modules'
import { label, statusTone } from '../../lib/enums'
import { fmtDateTime } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import QrCode from '../../components/ui/QrCode'
import FilterChips from '../../components/ui/FilterChips'

/**
 * Credencial QR (12) — V-06.
 *
 * La credencial es lo que se enseña en la puerta del evento, así que manda el
 * QR: grande, sobre blanco, y con los datos justos para que quien escanea
 * confirme que es el evento correcto.
 *
 * `qr_status` distingue Activa / Usada / Expirada. Una credencial usada se
 * conserva —es el comprobante de que asististe— pero deja de mostrar el código,
 * que ya no sirve para nada y solo confundiría en la fila.
 */
export default function Credenciales() {
  const { profile: perfil } = useAuth()
  const fetcher = useCallback(() => profile.registrations(), [])
  const credenciales = useApi(fetcher)

  const [filtro, setFiltro] = useState('activas')

  const opciones = [
    { value: 'activas', label: 'Vigentes' },
    { value: 'todas', label: 'Todas' },
  ]

  const visibles = useMemo(() => {
    const lista = credenciales.data ?? []
    const ordenada = [...lista].sort(
      (a, b) => new Date(a.starts_at ?? 0) - new Date(b.starts_at ?? 0),
    )
    return filtro === 'activas'
      ? ordenada.filter((item) => item.qr_status === 'Active')
      : ordenada
  }, [credenciales.data, filtro])

  return (
    <>
      <SectionTitle
        eyebrow="Mi espacio"
        title="Mi credencial QR"
        description="Muestra este código en la entrada del evento."
      />

      <div className="mb-5">
        <FilterChips
          items={opciones}
          selected={filtro}
          onSelect={setFiltro}
          ariaLabel="Filtrar credenciales"
        />
      </div>

      {credenciales.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : credenciales.error ? (
        <p className="text-sm text-danger">No se pudieron cargar tus credenciales.</p>
      ) : visibles.length === 0 ? (
        <EmptyState
          message={
            filtro === 'activas'
              ? 'No tienes credenciales vigentes.'
              : 'Aún no tienes credenciales.'
          }
          hint="Inscríbete a un evento y su credencial aparecerá aquí."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((credencial) => {
            const activa = credencial.qr_status === 'Active'
            return (
              <li
                key={credencial.id}
                className="overflow-hidden rounded-[14px] bg-surface shadow-card ring-1 ring-border"
              >
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="t-heading leading-tight">{credencial.event_name}</p>
                      <p className="t-data mt-1">{credencial.club_acronym}</p>
                    </div>
                    <Badge
                      text={credencial.qr_status_label ?? label(credencial.qr_status)}
                      tone={statusTone(credencial.qr_status)}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 px-5 py-6">
                  {activa ? (
                    <>
                      <QrCode value={credencial.qr_token} size={190} />
                      <p className="text-center">
                        <span className="t-caption">{perfil?.full_name}</span>
                        {' · '}
                        {/* La matrícula es un registro: siempre en mono. */}
                        <span className="t-data">{perfil?.enrollment}</span>
                      </p>
                    </>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="t-subtitle">
                        {credencial.qr_status === 'Used'
                          ? 'Credencial ya utilizada'
                          : 'Credencial expirada'}
                      </p>
                      <p className="t-caption mt-1">
                        {credencial.qr_status === 'Used'
                          ? 'Tu asistencia quedó registrada.'
                          : 'El evento terminó.'}
                      </p>
                    </div>
                  )}
                </div>

                <dl className="border-t border-border px-5 py-3">
                  <div className="flex justify-between gap-3 py-1">
                    <dt className="t-label">Cuándo</dt>
                    <dd className="t-data">{fmtDateTime(credencial.starts_at)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1">
                    <dt className="t-label">Dónde</dt>
                    <dd className="t-body text-right">{credencial.place || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-1">
                    <dt className="t-label">Asistencia</dt>
                    <dd>
                      <Badge
                        text={
                          credencial.attendance_status_label ??
                          label(credencial.attendance_status)
                        }
                        tone={statusTone(credencial.attendance_status)}
                      />
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-border px-5 py-3">
                  <Link to={ROUTES.APP_EVENTO.replace(':eventId', credencial.event)}>
                    <Button variant="ghost" size="sm">
                      Ver el evento
                    </Button>
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

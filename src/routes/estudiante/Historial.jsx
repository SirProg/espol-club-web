import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { profile } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { ROUTES } from '../../routing/modules'
import { label, statusTone } from '../../lib/enums'
import { fmtDateTime } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'

/**
 * Historial personal (15) — V-08.
 *
 * Dos secciones, tal como las define MASTER §13: postulaciones y asistencias.
 * Son cosas distintas —una pide permiso para entrar a un club, la otra deja
 * constancia de haber ido a un evento— así que no se mezclan en una sola lista
 * ordenada por fecha, aunque técnicamente cupieran.
 */
export default function Historial() {
  const appsFetcher = useCallback(() => profile.applications(), [])
  const regsFetcher = useCallback(() => profile.registrations(), [])
  const postulaciones = useApi(appsFetcher)
  const asistencias = useApi(regsFetcher)

  const [detalle, setDetalle] = useState(null)

  const cargando = postulaciones.loading || asistencias.loading
  const listaPostulaciones = postulaciones.data ?? []
  const listaAsistencias = asistencias.data ?? []
  const vacio =
    !cargando && listaPostulaciones.length === 0 && listaAsistencias.length === 0

  return (
    <>
      <SectionTitle
        eyebrow="Mi cuenta"
        title="Historial"
        description="Tus postulaciones a clubes y tu paso por los eventos."
      />

      {cargando ? (
        <p className="t-caption">Cargando…</p>
      ) : vacio ? (
        <EmptyState
          message="Todavía no registras postulaciones ni asistencias."
          hint="Explora el catálogo de clubes para empezar."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="t-subtitle mb-3">Postulaciones</h2>
            {listaPostulaciones.length === 0 ? (
              <EmptyState message="Aún no has postulado a ningún club." />
            ) : (
              <ul className="space-y-3">
                {listaPostulaciones.map((item) => (
                  <li
                    key={item.id}
                    className="relative overflow-hidden rounded-[10px] bg-surface pl-4 shadow-card ring-1 ring-border"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-1 ${
                        statusTone(item.status) === 'success'
                          ? 'bg-success'
                          : statusTone(item.status) === 'danger'
                            ? 'bg-danger'
                            : 'bg-warning'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setDetalle(item)}
                      className="block w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="t-body font-semibold">{item.club_name}</p>
                          <p className="t-data mt-0.5">{item.club_acronym}</p>
                        </div>
                        <Badge
                          text={item.status_label ?? label(item.status)}
                          tone={statusTone(item.status)}
                        />
                      </div>
                      <p className="t-caption mt-2">
                        Enviada el {fmtDateTime(item.submitted_at)}
                      </p>
                      {item.leader_feedback && (
                        <p className="t-caption mt-2 rounded-[6px] bg-surface-alt px-2 py-1.5">
                          «{item.leader_feedback}»
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="t-subtitle mb-3">Asistencias</h2>
            {listaAsistencias.length === 0 ? (
              <EmptyState message="Aún no te has inscrito a ningún evento." />
            ) : (
              <ul className="space-y-3">
                {listaAsistencias.map((item) => (
                  <li
                    key={item.id}
                    className="relative overflow-hidden rounded-[10px] bg-surface pl-4 shadow-card ring-1 ring-border"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-1 ${
                        item.attendance_status === 'Attended'
                          ? 'bg-success'
                          : item.attendance_status === 'NoShow'
                            ? 'bg-danger'
                            : 'bg-warning'
                      }`}
                    />
                    <Link
                      to={ROUTES.APP_EVENTO.replace(':eventId', item.event)}
                      className="block p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="t-body font-semibold">{item.event_name}</p>
                          <p className="t-data mt-0.5">{item.club_acronym}</p>
                        </div>
                        <Badge
                          text={
                            item.attendance_status_label ?? label(item.attendance_status)
                          }
                          tone={statusTone(item.attendance_status)}
                        />
                      </div>
                      <p className="t-caption mt-2">{fmtDateTime(item.starts_at)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <Modal
        open={Boolean(detalle)}
        onClose={() => setDetalle(null)}
        title={detalle?.club_name ?? ''}
        description={
          detalle ? `Postulación enviada el ${fmtDateTime(detalle.submitted_at)}` : undefined
        }
        wide
      >
        {detalle && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge
                text={detalle.status_label ?? label(detalle.status)}
                tone={statusTone(detalle.status)}
              />
              {detalle.resolved_at && (
                <span className="t-caption">Resuelta el {fmtDateTime(detalle.resolved_at)}</span>
              )}
            </div>

            {detalle.leader_feedback && (
              <div>
                <p className="t-label mb-1">Respuesta del club</p>
                <p className="t-body rounded-[10px] bg-surface-alt px-3 py-2">
                  {detalle.leader_feedback}
                </p>
              </div>
            )}

            {(detalle.answers ?? []).length > 0 ? (
              <div>
                <p className="t-label mb-2">Tus respuestas</p>
                <dl className="space-y-3">
                  {detalle.answers.map((answer) => (
                    <div key={answer.field_id}>
                      <dt className="t-label">{answer.label}</dt>
                      <dd className="t-body mt-0.5">
                        {Array.isArray(answer.answer)
                          ? answer.answer.join(', ')
                          : String(answer.answer ?? '—')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="t-caption">Esta postulación no conserva respuestas.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

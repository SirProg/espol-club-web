import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'

import { applications, clubs, events } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { ROUTES } from '../../routing/modules'
import { label, statusTone } from '../../lib/enums'
import { fmtDateTime, plural } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Pennant from '../../components/ui/Pennant'
import InfoRow from '../../components/ui/InfoRow'
import EmptyState from '../../components/ui/EmptyState'

/**
 * Detalle de club (7) — V-02 / V-03.
 *
 * Una sola pantalla con dos modos, gobernados por RN-3 y resueltos en el
 * servidor: a un no miembro le llega el serializer público (sin nómina, con los
 * documentos marcados públicos); a un miembro le llega el interno, con la
 * nómina y todos los documentos. Aquí no se filtra nada — lo que no debe verse
 * sencillamente no llega, que es la única forma de que no se escape.
 */
export default function ClubDetalle() {
  const { clubId } = useParams()

  const clubFetcher = useCallback(() => clubs.detail(clubId), [clubId])
  const canApplyFetcher = useCallback(() => applications.canApply(clubId), [clubId])
  const eventsFetcher = useCallback(() => events.list({ club: clubId, upcoming: 'true' }), [clubId])

  const club = useApi(clubFetcher)
  const canApply = useApi(canApplyFetcher)
  const agenda = useApi(eventsFetcher)

  const data = club.data
  // El serializer interno añade `members`; su presencia es la señal de que
  // quien mira pertenece al club.
  const esMiembro = Array.isArray(data?.members)

  if (club.loading) return <p className="t-caption">Cargando…</p>
  if (club.error) {
    return <p className="text-sm text-danger">No se pudo cargar este club.</p>
  }

  const permitido = canApply.data?.allowed
  const motivo = canApply.data?.reason

  return (
    <>
      <SectionTitle eyebrow="Clubes" title={data.name} description={data.acronym}>
        <Link to={ROUTES.APP_CLUBES} className="t-caption underline underline-offset-2">
          Volver al catálogo
        </Link>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="flex gap-4">
              <Pennant text={data.acronym} width={44} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="t-heading">{data.name}</p>
                  <Badge text={label(data.status)} tone={statusTone(data.status)} />
                </div>
                <p className="t-body mt-2 text-ink-muted">
                  {data.description || 'Este club aún no ha publicado información.'}
                </p>
              </div>
            </div>

            <dl className="mt-4 border-t border-border pt-2">
              <InfoRow label="Facultad" value={data.faculty_name ?? '—'} />
              <InfoRow label="Ubicación" value={data.location || '—'} />
              <InfoRow
                label="Áreas de interés"
                value={(data.interest_areas ?? []).map((a) => a.name).join(' · ') || '—'}
              />
              <InfoRow
                label="Miembros"
                value={plural(data.members_count, 'miembro activo', 'miembros activos')}
              />
              {esMiembro && data.leader && (
                <InfoRow label="Líder" value={data.leader.full_name} />
              )}
            </dl>

            {(data.social_media ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {data.social_media.map((red) => (
                  <a
                    key={red.link}
                    href={red.link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[6px] bg-surface-alt px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft"
                  >
                    {red.network}
                  </a>
                ))}
              </div>
            )}
          </Card>

          {/* Nómina interna: solo llega si eres miembro (V-03). */}
          {esMiembro && (
            <Card title="Miembros del club" subtitle="Solo la ven quienes pertenecen al club">
              {data.members.length === 0 ? (
                <EmptyState message="Aún no hay miembros registrados." />
              ) : (
                <ul className="divide-y divide-border">
                  {data.members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="t-body truncate font-medium">{member.full_name}</p>
                        <p className="t-data">{member.enrollment}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="t-caption hidden sm:inline">{member.role_name}</span>
                        <Badge
                          text={member.status_label ?? label(member.status)}
                          tone={statusTone(member.status)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card
            title="Documentos"
            subtitle={esMiembro ? 'Incluye los documentos internos' : 'Documentos públicos'}
          >
            {(data.documents ?? []).length === 0 ? (
              <EmptyState message="Este club aún no ha publicado documentos." />
            ) : (
              <ul className="divide-y divide-border">
                {data.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="t-body truncate">{doc.title}</p>
                      <p className="t-caption">{fmtDateTime(doc.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!doc.is_public && <Badge text="Interno" tone="warning" />}
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Abrir
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Unirme al club">
            {canApply.loading ? (
              <p className="t-caption">Comprobando…</p>
            ) : permitido ? (
              <>
                <p className="t-body text-ink-muted">
                  Responde el formulario del club y su directiva revisará tu solicitud.
                </p>
                <div className="mt-4">
                  <Link to={ROUTES.APP_POSTULAR.replace(':clubId', clubId)}>
                    <Button>Postular</Button>
                  </Link>
                </div>
              </>
            ) : (
              // El servidor explica por qué no se puede; repetirlo aquí evita
              // ofrecer un botón que llevaría a un formulario cerrado.
              <p className="t-body text-ink-muted">
                {motivo ?? 'Por ahora no puedes postular a este club.'}
              </p>
            )}
          </Card>

          <Card title="Próximos eventos">
            {agenda.loading ? (
              <p className="t-caption">Cargando…</p>
            ) : (agenda.data ?? []).length === 0 ? (
              <EmptyState message="Este club no tiene eventos próximos." />
            ) : (
              <ul className="divide-y divide-border">
                {agenda.data.slice(0, 5).map((evento) => (
                  <li key={evento.id} className="py-2.5">
                    <Link
                      to={ROUTES.APP_EVENTO.replace(':eventId', evento.id)}
                      className="block hover:opacity-80"
                    >
                      <p className="t-body font-medium">{evento.event_name}</p>
                      <p className="t-caption">{fmtDateTime(evento.start_datetime)}</p>
                      {evento.visibility === 'MembersOnly' && (
                        <span className="mt-1 inline-block">
                          <Badge text="Solo miembros" tone="warning" />
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

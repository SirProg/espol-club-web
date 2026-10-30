import { Link } from 'react-router-dom'
import { useCallback } from 'react'

import { applications, clubs, events } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { ROUTES } from '../../routing/modules'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import InfoRow from '../../components/ui/InfoRow'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { label, statusTone } from '../../lib/enums'
import { fmtDateTime } from '../../lib/format'
import ClubMark from '../../components/ui/ClubMark'

/**
 * Panel del Líder (17) — el resumen que el líder ve al entrar.
 * Estado del club, pendientes y próximos eventos en una sola pasada.
 */
export default function Panel() {
  const { ledClubId } = useAuth()

  const clubFetcher = useCallback(() => clubs.detail(ledClubId), [ledClubId])
  const requestsFetcher = useCallback(
    () => applications.list(ledClubId, { status: 'Pending' }),
    [ledClubId],
  )
  const eventsFetcher = useCallback(() => events.listByClub(ledClubId), [ledClubId])

  const club = useApi(clubFetcher)
  const requests = useApi(requestsFetcher)
  const eventsData = useApi(eventsFetcher)

  const loading = club.loading || requests.loading || eventsData.loading

  const upcoming = (eventsData.data ?? [])
    .filter((event) => event.start_datetime && new Date(event.start_datetime) >= new Date())
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
    .slice(0, 3)

  return (
    <>
      <SectionTitle
        eyebrow="Panel del club"
        title={club.data?.name ?? 'Tu club'}
        description={club.data?.description}
      >
        {club.data && <Badge text={label(club.data.status)} tone={statusTone(club.data.status)} />}
      </SectionTitle>

      {loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card
            title="Estado del club"
            subtitle={club.data?.acronym ? `Sigla ${club.data.acronym}` : undefined}
            className="lg:col-span-2"
            header={
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ClubMark acronym={club.data?.acronym} size={54} />
                  <div>
                    <h3 className="t-heading">{club.data?.name}</h3>
                    <p className="t-caption">{club.data?.acronym}</p>
                  </div>
                </div>
                <Badge text={label(club.data?.status)} tone={statusTone(club.data?.status)} />
              </div>
            }
          >
            <dl>
              <InfoRow label="Estado" mono>{label(club.data?.status)}</InfoRow>
              <InfoRow label="Facultad">{club.data?.faculty_name ?? '—'}</InfoRow>
              <InfoRow label="Ubicación">{club.data?.location ?? '—'}</InfoRow>
              <InfoRow label="Miembros activos" mono>{club.data?.members_count ?? 0}</InfoRow>
              <InfoRow label="Líder">
                {club.data?.leader
                  ? `${club.data.leader.full_name} (${club.data.leader.enrollment})`
                  : 'Sin líder asignado'}
              </InfoRow>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={ROUTES.LIDER_MIEMBROS}>
                <Button variant="secondary" size="sm">Ver miembros</Button>
              </Link>
              <Link to={ROUTES.LIDER_SOLICITUDES}>
                <Button variant="secondary" size="sm">Solicitudes</Button>
              </Link>
            </div>
          </Card>

          <Card title="Solicitudes pendientes" tone="warning">
            {requests.loading ? (
              <p className="t-caption">Cargando…</p>
            ) : requests.empty ? (
              <EmptyState message="No hay solicitudes por revisar." width={36} />
            ) : (
              <>
                <p className="t-heading text-3xl">{requests.data.length}</p>
                <p className="t-caption mt-1">
                  Postulaciones esperando tu decisión.
                </p>
                <Link to={ROUTES.LIDER_SOLICITUDES} className="mt-3 inline-block">
                  <Button size="sm">Revisar</Button>
                </Link>
              </>
            )}
          </Card>

          <Card
            title="Próximos eventos"
            className="lg:col-span-2"
            right={
              <Link to={ROUTES.LIDER_EVENTOS} className="t-caption text-primary underline">
                Ver todos
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <EmptyState message="Aún no hay eventos programados." width={36} />
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="t-body font-medium">{event.event_name}</p>
                      <p className="t-caption">{fmtDateTime(event.start_datetime)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Badge text={event.mode_label} tone="neutral" />
                      {event.visibility_label && (
                        <Badge text={event.visibility_label} tone={event.visibility === 'Public' ? 'success' : 'warning'} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

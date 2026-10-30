import { useCallback } from 'react'
import { Link } from 'react-router-dom'

import { events, profile } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { ROUTES } from '../../routing/modules'
import { label, statusTone } from '../../lib/enums'
import { fmtDateTime, plural } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ClubMark from '../../components/ui/ClubMark'
import EmptyState from '../../components/ui/EmptyState'

/**
 * Inicio del estudiante.
 *
 * No es un panel de métricas: es el atajo a lo que tiene fecha. Primero la
 * credencial que vas a necesitar pronto, luego tus clubes y por último la
 * cartelera. Quien no pertenezca a ningún club ve, en ese hueco, la invitación
 * a explorar el catálogo, que es el eje del producto (MASTER §1.3).
 */
export default function Inicio() {
  const { session, profile: perfil } = useAuth()

  const credsFetcher = useCallback(() => profile.registrations({ usable: true }), [])
  const eventosFetcher = useCallback(() => events.list({ upcoming: 'true' }), [])
  const credenciales = useApi(credsFetcher)
  const agenda = useApi(eventosFetcher)

  const membresias = session?.memberships ?? []

  const proximas = [...(credenciales.data ?? [])]
    .sort((a, b) => new Date(a.starts_at ?? 0) - new Date(b.starts_at ?? 0))
    .slice(0, 3)

  const cartelera = (agenda.data ?? []).slice(0, 4)
  const nombre = perfil?.full_name?.split(' ')[0] ?? 'Hola'

  return (
    <>
      <SectionTitle
        eyebrow="Mi espacio"
        title={`Hola, ${nombre}`}
        description="Esto es lo que tienes por delante."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card
            title="Tus próximos eventos"
            subtitle="Credenciales listas para usar"
            actions={
              <Link to={ROUTES.APP_CREDENCIALES}>
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            }
          >
            {credenciales.loading ? (
              <p className="t-caption">Cargando…</p>
            ) : proximas.length === 0 ? (
              <EmptyState
                message="No tienes credenciales vigentes."
                hint="Inscríbete a un evento para generar la tuya."
              />
            ) : (
              <ul className="divide-y divide-border">
                {proximas.map((item) => (
                  <li key={item.id} className="py-3">
                    <Link
                      to={ROUTES.APP_CREDENCIALES}
                      className="flex flex-col gap-1 hover:opacity-80 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="t-body font-semibold">{item.event_name}</p>
                        <p className="t-caption mt-0.5">
                          {item.club_acronym} · {item.place || 'Sin lugar'}
                        </p>
                      </div>
                      {/* En móvil la fecha baja: en mono no encoge y a 375px
                          empujaba la tarjeta fuera de la pantalla. */}
                      <p className="t-data sm:shrink-0 sm:text-right">
                        {fmtDateTime(item.starts_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Cartelera"
            subtitle="Lo que organizan los clubes"
            actions={
              <Link to={ROUTES.APP_EVENTOS}>
                <Button variant="ghost" size="sm">
                  Ver todos
                </Button>
              </Link>
            }
          >
            {agenda.loading ? (
              <p className="t-caption">Cargando…</p>
            ) : cartelera.length === 0 ? (
              <EmptyState message="No hay eventos disponibles por ahora." />
            ) : (
              <ul className="divide-y divide-border">
                {cartelera.map((evento) => (
                  <li key={evento.id} className="py-3">
                    <Link
                      to={ROUTES.APP_EVENTO.replace(':eventId', evento.id)}
                      className="flex items-start justify-between gap-3 hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="t-body font-semibold">{evento.event_name}</p>
                        <p className="t-caption mt-0.5">
                          {evento.club_acronym} · {fmtDateTime(evento.start_datetime)}
                        </p>
                      </div>
                      {evento.visibility === 'MembersOnly' && (
                        <Badge text="Solo miembros" tone="warning" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Mis clubes">
            {membresias.length === 0 ? (
              <>
                <p className="t-body text-ink-muted">
                  Todavía no perteneces a ningún club. Hay {' '}
                  comunidades de tecnología, cultura, deporte y emprendimiento esperándote.
                </p>
                <div className="mt-4">
                  <Link to={ROUTES.APP_CLUBES}>
                    <Button>Explorar clubes</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {membresias.map((m) => (
                    <li key={m.club_id} className="py-2.5">
                      <Link
                        to={ROUTES.APP_CLUB.replace(':clubId', m.club_id)}
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                        <ClubMark acronym={m.club_acronym} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="t-body truncate font-medium">{m.club_name}</p>
                          <p className="t-caption">{m.role_name}</p>
                        </div>
                        {m.club_status !== 'Active' && (
                          <Badge text={label(m.club_status)} tone={statusTone(m.club_status)} />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="t-caption mt-3">
                  {plural(membresias.length, 'club', 'clubes')} · {' '}
                  <Link to={ROUTES.APP_CLUBES} className="text-primary underline underline-offset-2">
                    explorar más
                  </Link>
                </p>
              </>
            )}
          </Card>

          <Card title="Tu historial">
            <p className="t-body text-ink-muted">
              Revisa en qué clubes has postulado y a qué eventos asististe.
            </p>
            <div className="mt-4">
              <Link to={ROUTES.APP_HISTORIAL}>
                <Button variant="secondary">Ver historial</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

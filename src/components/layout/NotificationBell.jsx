import { useCallback, useState } from 'react'

import { notifications } from '../../lib/api/endpoints'
import { fmtDateTime } from '../../lib/format'
import { useApi } from '../../hooks/useApi'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'

/**
 * Centro de notificaciones (pantalla 5). No tiene página propia: es la campana
 * de la barra superior, presente en los dos entornos (MASTER §10 A).
 *
 * `GET /notifications/` responde `{unread_count, results}` — envoltorio propio
 * del endpoint, no la paginación de DRF. El contador viene del servidor: es él
 * quien sabe cuántas hay sin leer, no la página que solo trae las recientes.
 */

/**
 * Tono de cada tipo de notificación. Los 12 tipos del servidor
 * (apps/notifications/models.py) se agrupan por lo que significan para quien
 * los lee: algo salió bien, algo fue rechazado, o algo pide atención.
 */
function toneFor(type) {
  if (!type) return 'neutral'
  const value = String(type).toLowerCase()
  if (value.includes('approved') || value.includes('activated')) return 'success'
  if (value.includes('rejected') || value.includes('revoked') || value.includes('expired')) {
    return 'danger'
  }
  if (value.includes('pending') || value.includes('submitted') || value.includes('frozen')) {
    return 'warning'
  }
  return 'neutral'
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [marking, setMarking] = useState(false)

  const fetcher = useCallback(() => notifications.list(), [])
  const { data, error, loading, reload } = useApi(fetcher, { reloadOnFocus: true })

  const items = data?.results ?? []
  const unread = data?.unread_count ?? 0

  // Marca explícita y no automática al abrir: abrir la campana para mirar no es
  // lo mismo que dar por leído, y el contador es la única señal que queda.
  async function markAll() {
    setMarking(true)
    try {
      await notifications.markRead()
      reload()
    } finally {
      setMarking(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-md p-2 text-ink-muted hover:bg-surface-alt"
        aria-label={
          unread > 0 ? `Notificaciones: ${unread} sin leer` : 'Notificaciones'
        }
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-on-danger">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Notificaciones"
        description={
          unread > 0 ? `Tienes ${unread} sin leer.` : 'Estás al día.'
        }
        wide
        footer={
          unread > 0 ? (
            <Button variant="secondary" onClick={markAll} disabled={marking}>
              {marking ? 'Marcando…' : 'Marcar todas como leídas'}
            </Button>
          ) : null
        }
      >
        {loading && <p className="t-caption">Cargando…</p>}

        {error && (
          <p className="text-sm text-danger">
            No se pudieron cargar las notificaciones. Reintenta en un momento.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState message="No tienes notificaciones." />
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-border">
            {items.slice(0, 30).map((item) => (
              <li key={item.id} className="relative py-3 pl-3">
                {!item.read && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary"
                  />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={`text-sm ${
                        item.read ? 'text-ink-muted' : 'font-semibold text-ink'
                      }`}
                    >
                      {item.message}
                    </p>
                    <p className="mt-1 t-caption">
                      {item.club_acronym ? `${item.club_acronym} · ` : ''}
                      {fmtDateTime(item.date)}
                    </p>
                  </div>
                  <Badge text={item.type_label ?? item.type} tone={toneFor(item.type)} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && items.length > 30 && (
          <p className="t-caption mt-3">Mostrando las 30 más recientes.</p>
        )}
      </Modal>
    </>
  )
}

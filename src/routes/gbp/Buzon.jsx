import { useCallback, useState } from 'react'

import { catalogs, clubs, gbp } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { label, statusTone } from '../../lib/enums'
import { fmtDateTime } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import DesktopOnly from '../../components/ui/DesktopOnly'
import { useToast } from '../../components/ui/toast-context'

const PROCESS_TONES = {
  Submitted: 'neutral',
  'Under Review': 'warning',
  Approved: 'success',
  Rejected: 'danger',
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'Submitted', label: 'Enviado' },
  { value: 'Under Review', label: 'En revisión' },
  { value: 'Approved', label: 'Aprobado' },
  { value: 'Rejected', label: 'Rechazado' },
]

/**
 * Buzón de trámites de GBP (31) — RF-42 a RF-44, V-23.
 *
 * Audita y resuelve los reportes que envían los clubes: tomar en revisión
 * (PPD-05), aprobar, rechazar con feedback obligatorio (RN-5) y exportar la
 * nómina congelada. Todo su manejo es exclusivo de escritorio (RF-54).
 */
export default function Buzon() {
  const toast = useToast()

  const [status, setStatus] = useState('')
  const [pao, setPao] = useState('')
  const [clubId, setClubId] = useState('')

  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const clubsFetcher = useCallback(() => clubs.list({}), [])
  const inboxFetcher = useCallback(
    () => gbp.inbox({ status, pao, club: clubId }),
    [status, pao, clubId],
  )

  const catalogsData = useApi(catalogFetcher)
  const allClubs = useApi(clubsFetcher)
  const inbox = useApi(inboxFetcher)

  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  async function openDetail(process) {
    setSelected(process)
    setDetail(null)
    setFeedback('')
    setRejecting(false)
    setError(null)
    setLoadingDetail(true)
    try {
      const full = await gbp.process(process.id)
      setDetail(full)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingDetail(false)
    }
  }

  /**
   * Descarga el consolidado con los filtros puestos. El servidor solo acepta
   * `xlsx` en esta ruta (el `pdf` es de un trámite suelto), así que no se
   * ofrece elegir formato.
   */
  async function exportarConsolidado() {
    setExporting(true)
    try {
      await gbp.exportInbox({ status, pao, club: clubId })
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setExporting(false)
    }
  }

  async function take() {
    setBusy(true)
    try {
      await gbp.takeProcess(detail.id)
      toast.toast('Trámite tomado para revisión.', 'success')
      setSelected(null)
      inbox.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  async function review(approved) {
    if (!approved && !feedback.trim()) {
      setError('Debes explicar el motivo del rechazo (RN-5).')
      return
    }
    setBusy(true)
    try {
      await gbp.reviewProcess(detail.id, {
        approved,
        feedback: approved ? '' : feedback.trim(),
      })
      toast.toast(approved ? 'Trámite aprobado.' : 'Trámite rechazado.', 'success')
      setSelected(null)
      inbox.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const periods = catalogsData.data?.pao_periods ?? []

  const rows = (inbox.data ?? []).map((process) => ({
    ...process,
    __stripe: PROCESS_TONES[process.status] ?? 'neutral',
    documento: (
      <div>
        <div className="t-body font-medium">{process.document_type}</div>
        <div className="t-caption">
          {process.club_name} · {process.snapshot_size} filas
        </div>
      </div>
    ),
    estado: <Badge text={process.status_label} tone={PROCESS_TONES[process.status] ?? 'neutral'} />,
    enviado: fmtDateTime(process.uploaded_at),
    acciones: (
      <Button variant="secondary" size="sm" onClick={() => openDetail(process)}>
        Revisar
      </Button>
    ),
  }))

  const columns = [
    { key: 'documento', header: 'Documento', mobileMain: true },
    { key: 'club_acronym', header: 'Club', mono: true },
    { key: 'pao_period', header: 'PAO', mono: true },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => row.estado,
    },
    {
      key: 'enviado',
      header: 'Enviado',
      mono: true,
      className: 'hidden lg:table-cell',
    },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      // En móvil se pinta con `mobileActions`, fuera del botón de la fila.
      mobile: false,
      render: (row) => row.acciones,
    },
  ]

  const snapshotRows =
    (detail?.roster_snapshot ?? []).map((member, index) => ({
      __key: index,
      nombre: (
        <div>
          <div className="t-body font-medium">{member.full_name}</div>
          <div className="t-caption font-mono">{member.enrollment}</div>
        </div>
      ),
      rol: member.role ?? '—',
      estado: (
        <Badge
          text={label(member.status)}
          tone={member.status === 'Active' ? 'success' : statusTone(member.status)}
        />
      ),
    })) ?? []

  return (
    <>
      <SectionTitle
        eyebrow="Institución"
        title="Buzón de trámites"
        description="Reportes enviados por los clubes, pendientes de auditoría."
      >
        {/* Exportación consolidada (RF-42): respeta los filtros activos, así
            que exporta lo que se está viendo, no la tabla entera. */}
        <DesktopOnly>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportarConsolidado}
            disabled={exporting || rows.length === 0}
          >
            {exporting ? 'Exportando…' : 'Exportar .xlsx'}
          </Button>
        </DesktopOnly>
      </SectionTitle>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Estado"
          name="status"
          className="gap-1"
          children={
            <select
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="input"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Período"
          name="pao"
          className="gap-1"
          children={
            <select
              name="pao"
              value={pao}
              onChange={(event) => setPao(event.target.value)}
              className="input"
            >
              <option value="">Todos los períodos</option>
              {periods.map((period) => (
                <option key={period.pao_period} value={period.pao_period}>
                  {period.pao_period}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Club"
          name="club"
          className="gap-1"
          children={
            <select
              name="club"
              value={clubId}
              onChange={(event) => setClubId(event.target.value)}
              className="input"
            >
              <option value="">Todos los clubes</option>
              {(allClubs.data ?? []).map((club) => (
                <option key={club.id} value={club.id}>
                  {club.acronym}
                </option>
              ))}
            </select>
          }
        />
      </div>

      {inbox.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          rowKey="id"
          // Abrir un trámite es consulta, y la matriz de §4 permite consultar
          // todo en móvil: lo que RF-54 difiere al escritorio es resolverlo, y
          // de eso ya se encarga el DesktopOnly del pie del modal.
          mobileActions={(row) => row.acciones}
          empty={
            <EmptyState
              message="No hay trámites por revisar."
              hint="Los reportes que envíen los clubes aparecerán aquí."
            />
          }
        />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.document_type} — ${selected.club_acronym}` : ''}
        description={
          selected
            ? `${selected.pao_period} · enviado ${fmtDateTime(selected.uploaded_at)} · ${selected.snapshot_size} filas de nómina congelada`
            : ''
        }
        wide
        footer={
          detail ? (
            <DesktopOnly>
              {detail.status === 'Submitted' && (
                <Button variant="secondary" onClick={take} disabled={busy}>
                  {busy ? 'Tomando…' : 'Tomar en revisión'}
                </Button>
              )}
              {detail.status === 'Under Review' && (
                <>
                  <Button variant="secondary" onClick={() => setRejecting(true)} disabled={busy}>
                    Rechazar
                  </Button>
                  <Button onClick={() => review(true)} disabled={busy}>
                    {busy ? 'Aprobando…' : 'Aprobar'}
                  </Button>
                </>
              )}
              {detail.status !== 'Submitted' && detail.status !== 'Under Review' && (
                <p className="t-caption py-2">{detail.status_label}</p>
              )}
            </DesktopOnly>
          ) : null
        }
      >
        {loadingDetail ? (
          <p className="t-caption">Cargando…</p>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge text={detail.status_label} tone={PROCESS_TONES[detail.status] ?? 'neutral'} />
              {detail.reviewed_by_name && (
                <span className="t-caption">
                  Revisado por {detail.reviewed_by_name}
                  {detail.reviewed_at && ` · ${fmtDateTime(detail.reviewed_at)}`}
                </span>
              )}
            </div>

            {detail.review_feedback && (
              <div className="rounded-[10px] border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-700/50 dark:bg-warning-900/20 dark:text-warning-200">
                <span className="font-semibold">Feedback de GBP:</span> {detail.review_feedback}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {detail.file_url && (
                <a
                  href={detail.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                >
                  Abrir PDF
                </a>
              )}
              <Button
                variant="secondary"
                onClick={() => gbp.exportProcess(detail.id, 'xlsx')}
              >
                Exportar nómina (.xlsx)
              </Button>
            </div>

            <div>
              <p className="t-label mb-2">Nómina congelada</p>
              <Table
                columns={[
                  { key: 'nombre', header: 'Miembro', mobileMain: true },
                  { key: 'rol', header: 'Rol' },
                  { key: 'estado', header: 'Estado' },
                ]}
                rows={snapshotRows}
                rowKey="__key"
                empty={<EmptyState message="El trámite no incluye nómina congelada." width={36} />}
              />
            </div>

            {rejecting && (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  review(false)
                }}
                className="space-y-3 border-t border-border pt-4"
                noValidate
              >
                <Field
                  label="Motivo del rechazo"
                  name="feedback"
                  error={error}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Indica qué falta corregir (obligatorio, RN-5)"
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setRejecting(false)} disabled={busy}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" variant="danger" disabled={busy || !feedback.trim()}>
                    {busy ? 'Rechazando…' : 'Confirmar rechazo'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="t-caption text-danger">{error ?? 'No se pudo cargar el trámite.'}</p>
        )}
      </Modal>
    </>
  )
}

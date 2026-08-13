import { useCallback, useState } from 'react'

import { catalogs, gbp } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { DOCUMENT_TYPE_SUGGESTIONS, PERMISSIONS, UPLOAD_ACCEPT } from '../../lib/enums'
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

/**
 * Rendición de cuentas (27) — RF-40, F-16.
 *
 * El club envía a GBP reportes y documentos del período (nómina consolidada,
 * plan de trabajo, etc.). `document_type` es texto libre en el servidor, así
 * que el formulario ofrece un datalist de sugerencias, no un select cerrado.
 * La carga se difiere al escritorio (matriz §4); la consulta sí es móvil.
 */
export default function Rendicion() {
  const { ledClubId, can } = useAuth()
  const toast = useToast()

  const processesFetcher = useCallback(() => gbp.clubProcesses(ledClubId), [ledClubId])
  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const processes = useApi(processesFetcher)
  const catalogsData = useApi(catalogFetcher)

  const canSubmit = can(PERMISSIONS.SUBMIT_GBP_REPORTS)

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ pao_period: '', document_type: '', file: null })

  const periods = catalogsData.data?.pao_periods ?? []
  const activePao = catalogsData.data?.active_pao ?? null

  function openForm() {
    setForm({
      pao_period: activePao ?? periods[0]?.pao_period ?? '',
      document_type: '',
      file: null,
    })
    setError(null)
    setOpen(true)
  }

  function closeForm() {
    setOpen(false)
    setError(null)
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.pao_period || !form.document_type.trim() || !form.file) return
    const fd = new FormData()
    fd.append('pao_period', form.pao_period)
    fd.append('document_type', form.document_type.trim())
    fd.append('file', form.file)
    setBusy(true)
    try {
      await gbp.submitProcess(ledClubId, fd)
      toast.toast('Reporte enviado a GBP.', 'success')
      closeForm()
      processes.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const rows = (processes.data ?? []).map((process) => ({
    ...process,
    __stripe: PROCESS_TONES[process.status] ?? 'neutral',
    documento: (
      <div>
        <div className="t-body font-medium">{process.document_type}</div>
        <div className="t-caption">Enviado por {process.submitted_by_name ?? '—'}</div>
      </div>
    ),
    estado: <Badge text={process.status_label} tone={PROCESS_TONES[process.status] ?? 'neutral'} />,
    acciones: process.file_url ? (
      <a
        href={process.file_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center rounded-md px-3 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-soft"
      >
        Descargar
      </a>
    ) : (
      <span className="t-caption">—</span>
    ),
  }))

  const columns = [
    { key: 'documento', header: 'Documento', mobileMain: true },
    { key: 'pao_period', header: 'Período', mono: true },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => row.estado,
    },
    {
      key: 'uploaded_at',
      header: 'Enviado',
      mono: true,
      className: 'hidden lg:table-cell',
      render: (row) => fmtDateTime(row.uploaded_at),
    },
    {
      key: 'reviewed_by_name',
      header: 'Revisado por',
      className: 'hidden xl:table-cell',
      render: (row) => row.reviewed_by_name ?? '—',
    },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      mobile: false,
      render: (row) => row.acciones,
    },
  ]

  return (
    <>
      <SectionTitle
        eyebrow="Gestión del club"
        title="Rendición de cuentas"
        description="Reportes y documentos que el club envía a GBP."
      >
        {canSubmit && (
          <DesktopOnly>
            <Button size="sm" onClick={openForm}>
              Enviar reporte
            </Button>
          </DesktopOnly>
        )}
      </SectionTitle>

      {processes.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          rowKey="id"
          // Descargar el PDF enviado es consulta, no gestión: lo que RF-53
          // difiere al escritorio es enviar un reporte nuevo.
          mobileActions={(row) => (row.file_url ? row.acciones : null)}
          empty={
            <EmptyState
              message="Aún no has enviado reportes a GBP."
              hint="Envía la nómina consolidada o el plan de trabajo del período."
            />
          }
        />
      )}

      <Modal
        open={open}
        onClose={closeForm}
        title="Enviar reporte"
        description="El archivo debe ser PDF; GBP lo auditará junto a la nómina congelada."
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={busy}>
              Cancelar
            </Button>
            <Button
              onClick={submit}
              disabled={busy || !form.pao_period || !form.document_type.trim() || !form.file}
            >
              {busy ? 'Enviando…' : 'Enviar a GBP'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field
            label="Período"
            name="pao_period"
            error={error}
            className="gap-1"
            children={
              <select
                name="pao_period"
                value={form.pao_period}
                onChange={(event) => setForm({ ...form, pao_period: event.target.value })}
                className="input"
              >
                {periods.length === 0 && <option value="">Sin períodos</option>}
                {periods.map((period) => (
                  <option key={period.pao_period} value={period.pao_period}>
                    {period.pao_period}
                    {period.pao_period === activePao ? ' (activo)' : ''}
                  </option>
                ))}
              </select>
            }
            required
          />
          <Field
            label="Tipo de documento"
            name="document_type"
            error={error}
            hint="Por ejemplo: «Nómina de Miembros» o «Informe de actividades»."
            required
            children={
              <>
                <input
                  name="document_type"
                  list="document-type-suggestions"
                  value={form.document_type}
                  onChange={(event) => setForm({ ...form, document_type: event.target.value })}
                  className="input"
                  placeholder="Nómina de Miembros"
                />
                <datalist id="document-type-suggestions">
                  {DOCUMENT_TYPE_SUGGESTIONS.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </>
            }
          />
          <Field
            label="Archivo"
            name="file"
            type="file"
            accept={UPLOAD_ACCEPT}
            error={error}
            onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null })}
            required
          />
        </form>
      </Modal>
    </>
  )
}

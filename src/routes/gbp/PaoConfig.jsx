import { useCallback, useState } from 'react'

import { gbp } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { fmtDate, toDateInput } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import DesktopOnly from '../../components/ui/DesktopOnly'
import { useToast } from '../../components/ui/toast-context'

/**
 * Configuración del PAO (32) — RF-45, F-19, V-24.
 *
 * Crea y edita los períodos académicos y activa el vigente. Activar un período
 * cierra todos los demás en el servidor (invariante I-08); el cliente no tiene
 * que pedirlo. Gestión exclusiva de escritorio (RF-54).
 */
export default function PaoConfig() {
  const toast = useToast()
  const fetcher = useCallback(() => gbp.paoPeriods(), [])
  const periods = useApi(fetcher)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmActivate, setConfirmActivate] = useState(null)

  const [paoPeriod, setPaoPeriod] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activate, setActivate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function openCreate() {
    setPaoPeriod('')
    setStartDate('')
    setEndDate('')
    setActivate(false)
    setError(null)
    setCreating(true)
  }

  function openEdit(row) {
    setEditing(row)
    setStartDate(toDateInput(row.start_date))
    setEndDate(toDateInput(row.end_date))
    setActivate(row.status !== 'Active')
    setError(null)
  }

  function closeAll() {
    setCreating(false)
    setEditing(null)
    setActivate(false)
  }

  async function handleCreate(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await gbp.createPao({
        pao_period: paoPeriod.trim(),
        start_date: startDate,
        end_date: endDate,
        activate,
      })
      toast.toast('Período creado.', 'success')
      closeAll()
      periods.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleEdit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await gbp.updatePao(editing.pao_period, {
        start_date: startDate,
        end_date: endDate,
        activate,
      })
      toast.toast('Período actualizado.', 'success')
      closeAll()
      periods.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function confirmActivation() {
    setBusy(true)
    try {
      await gbp.updatePao(confirmActivate.pao_period, { activate: true })
      toast.toast('Período activado.', 'success')
      setConfirmActivate(null)
      periods.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
      setConfirmActivate(null)
    } finally {
      setBusy(false)
    }
  }

  const rows = (periods.data ?? []).map((period) => ({
    ...period,
    __stripe: period.status === 'Active' ? 'success' : 'neutral',
    período: (
      <div>
        <div className="t-body font-medium tabular-nums">{period.pao_period}</div>
        <div className="t-caption">Orden {period.sequence ?? '—'}</div>
      </div>
    ),
    vigencia: `${fmtDate(period.start_date)} — ${fmtDate(period.end_date)}`,
    estado: (
      <Badge
        text={period.status_label}
        tone={period.status === 'Active' ? 'success' : 'neutral'}
      />
    ),
    acciones: (
      <DesktopOnly>
        <div className="flex justify-end gap-2">
          {period.status !== 'Active' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmActivate(period)}
            >
              Activar
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => openEdit(period)}>
            Editar
          </Button>
        </div>
      </DesktopOnly>
    ),
  }))

  const columns = [
    { key: 'período', header: 'Período', mobileMain: true },
    {
      key: 'vigencia',
      header: 'Vigencia',
      mono: true,
      className: 'hidden md:table-cell',
    },
    { key: 'estado', header: 'Estado', render: (row) => row.estado },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      mobile: false,
      render: (row) => row.acciones,
    },
  ]

  const modalDescription = creating
    ? 'Registra un nuevo período del calendario académico (F-19).'
    : `Actualiza la vigencia de ${editing?.pao_period ?? 'este período'}.`

  return (
    <>
      <SectionTitle
        eyebrow="Institución"
        title="Configuración de PAO"
        description="Administra los períodos del calendario académico (RF-45)."
      >
        <DesktopOnly>
          <Button size="sm" onClick={openCreate}>
            Crear período
          </Button>
        </DesktopOnly>
      </SectionTitle>

      {periods.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          rowKey="pao_period"
          empty={
            <EmptyState
              message="No hay períodos configurados."
              hint="Crea el primer período para habilitar el calendario académico."
            />
          }
        />
      )}

      <Modal
        open={creating || Boolean(editing)}
        onClose={closeAll}
        title={creating ? 'Crear período' : `Editar ${editing?.pao_period ?? ''}`}
        description={modalDescription}
        footer={
          <>
            <Button variant="secondary" onClick={closeAll} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" onClick={creating ? handleCreate : handleEdit} disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form onSubmit={creating ? handleCreate : handleEdit} className="grid gap-4" noValidate>
          {creating && (
            <Field
              label="Identificador"
              name="pao_period"
              value={paoPeriod}
              onChange={(event) => setPaoPeriod(event.target.value)}
              placeholder="2026-I"
              error={error?.forField('pao_period')}
              hint="Formato libre, por ejemplo «2026-I» o «2025-II»."
              required
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Fecha de inicio"
              name="start_date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              error={error?.forField('start_date')}
              required
            />
            <Field
              label="Fecha de fin"
              name="end_date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              error={error?.forField('end_date')}
              required
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={activate}
              onChange={(event) => setActivate(event.target.checked)}
              className="checkbox"
            />
            Activar este período (cierra los demás, I-08)
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmActivate)}
        onClose={() => setConfirmActivate(null)}
        onConfirm={confirmActivation}
        title="Activar período"
        message={
          confirmActivate
            ? `¿Confirmas activar ${confirmActivate.pao_period}? Todos los demás períodos se cerrarán automáticamente.`
            : ''
        }
        confirmLabel="Activar"
        busy={busy}
      />
    </>
  )
}

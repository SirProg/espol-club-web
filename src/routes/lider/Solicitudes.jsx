import { useCallback, useState } from 'react'

import { applications } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { label, statusTone } from '../../lib/enums'
import { fmtDateTime } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/toast-context'

const TABS = [
  { key: 'Pending', label: 'Pendientes' },
  { key: 'Approved', label: 'Aprobadas' },
  { key: 'Rejected', label: 'Rechazadas' },
]

/**
 * Solicitudes de membresía (21) — el trabajo principal del líder.
 *
 * Se aprueba o rechaza desde el móvil también (RF-57): el rechazo exige
 * explicar el motivo (RN-5), así que se abre un diálogo con un texto obligatorio.
 */
export default function Solicitudes() {
  const { ledClubId } = useAuth()
  const toast = useToast()

  const [tab, setTab] = useState('Pending')
  const [selected, setSelected] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState(null)
  const [approving, setApproving] = useState(null)
  const [busy, setBusy] = useState(false)

  const fetcher = useCallback(() => applications.list(ledClubId, { status: tab }), [ledClubId, tab])
  const { data, loading, error, empty, reload } = useApi(fetcher)

  async function approve() {
    setBusy(true)
    try {
      await applications.approve(approving.id)
      toast.toast(`Se aprobó la solicitud de ${approving.student.full_name}.`, 'success')
      setApproving(null)
      setSelected(null)
      reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  async function reject(event) {
    event.preventDefault()
    if (!feedback.trim()) {
      setFeedbackError('Explica el motivo del rechazo (RN-5).')
      return
    }
    setBusy(true)
    try {
      await applications.reject(rejecting.id, feedback)
      toast.toast(`Se rechazó la solicitud de ${rejecting.student.full_name}.`, 'success')
      setRejecting(null)
      setSelected(null)
      setFeedback('')
      reload()
    } catch (err) {
      // El servidor señala el campo culpable en el sobre de error
      // ({error:{field:'feedback'}}), así que el mensaje aterriza bajo su input
      // en vez de en un aviso suelto.
      setFeedbackError(err.forField?.('feedback') ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  const rows = (data ?? []).map((application) => ({
    ...application,
    __stripe: statusTone(application.status),
    __right: (
      <Badge text={application.status_label ?? label(application.status)} tone={statusTone(application.status)} />
    ),
  }))

  const columns = [
    { key: 'student', header: 'Postulante', mobileMain: true, render: (row) => row.student.full_name },
    { key: 'enrollment', header: 'Matrícula', mono: true, render: (row) => row.student.enrollment },
    { key: 'email', header: 'Correo', className: 'hidden md:table-cell', render: (row) => row.student.email },
    { key: 'faculty', header: 'Facultad', className: 'hidden lg:table-cell', render: (row) => row.student.faculty ?? '—' },
    { key: 'submitted_at', header: 'Enviada', mono: true, className: 'hidden md:table-cell', render: (row) => fmtDateTime(row.submitted_at) },
    {
      key: 'status',
      header: 'Estado',
      // En móvil el estado ya va en el badge de la esquina de la tarjeta.
      mobile: false,
      render: (row) => <Badge text={row.status_label ?? label(row.status)} tone={statusTone(row.status)} />,
    },
  ]

  return (
    <>
      <SectionTitle eyebrow="Gestión del club" title="Solicitudes" description="Postulaciones por resolver." />

      <div className="mb-4 flex gap-1 rounded-md bg-surface-alt p-1 sm:inline-flex" role="tablist">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            role="tab"
            aria-selected={tab === tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold sm:flex-none ${
              tab === tabItem.key ? 'bg-primary text-on-primary' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="t-caption">Cargando…</p>
      ) : error ? (
        <p className="text-sm text-danger">{error.message}</p>
      ) : empty ? (
        <EmptyState
          message={`No hay solicitudes ${tab === 'Pending' ? 'pendientes' : tab === 'Approved' ? 'aprobadas' : 'rechazadas'}.`}
          hint="Cuando un estudiante envíe el formulario de postulación, aparecerá aquí."
        />
      ) : (
        <Table columns={columns} rows={rows} rowKey="id" onRowClick={setSelected} />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.student?.full_name ?? 'Solicitud'}
        description={`Matrícula ${selected?.student?.enrollment ?? ''} · ${fmtDateTime(selected?.submitted_at)}`}
        wide
        footer={
          selected?.status === 'Pending' ? (
            <>
              <Button variant="secondary" onClick={() => { setRejecting(selected); setFeedback(''); setFeedbackError(null) }}>
                Rechazar
              </Button>
              <Button onClick={() => setApproving(selected)}>Aprobar</Button>
            </>
          ) : (
            <>
              {selected?.status === 'Rejected' && (
                <p className="mr-auto t-caption">
                  Motivo: {selected?.leader_feedback ?? '—'}
                </p>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)}>Cerrar</Button>
            </>
          )
        }
      >
        {selected && (
          <dl className="space-y-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <dt className="t-label">Correo</dt>
                <dd className="t-body">{selected.student.email}</dd>
              </div>
              <div>
                <dt className="t-label">Facultad</dt>
                <dd className="t-body">{selected.student.faculty ?? '—'}</dd>
              </div>
              <div>
                <dt className="t-label">Carrera</dt>
                <dd className="t-body">{selected.student.career ?? '—'}</dd>
              </div>
              <div>
                <dt className="t-label">Semestre</dt>
                <dd className="t-body">{selected.student.semester ?? '—'}</dd>
              </div>
            </div>

            {selected.answers?.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="t-label mb-2">Respuestas al formulario</p>
                <ul className="space-y-2">
                  {selected.answers.map((answer, index) => (
                    <li key={`${answer.field_id}-${index}`} className="rounded-md bg-surface-alt px-3 py-2">
                      <p className="t-label">{answer.label}</p>
                      <p className="t-body whitespace-pre-wrap">
                        {Array.isArray(answer.answer)
                          ? answer.answer.join(', ')
                          : String(answer.answer ?? '—')}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(approving)}
        onClose={() => setApproving(null)}
        onConfirm={approve}
        title="Aprobar solicitud"
        message={
          approving
            ? `¿Confirmas que ${approving.student.full_name} (${approving.student.enrollment}) entra al club?`
            : ''
        }
        confirmLabel="Aprobar"
        busy={busy}
      />

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Rechazar solicitud"
        description={
          rejecting
            ? `Motivo para ${rejecting.student.full_name} (${rejecting.student.enrollment})`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={reject} disabled={busy || !feedback.trim()}>
              {busy ? 'Rechazando…' : 'Rechazar solicitud'}
            </Button>
          </>
        }
      >
        <form onSubmit={reject} noValidate>
          <label htmlFor="reject-feedback" className="t-label">
            Motivo del rechazo <span className="text-danger">*</span>
          </label>
          <textarea
            id="reject-feedback"
            value={feedback}
            onChange={(event) => { setFeedback(event.target.value); setFeedbackError(null) }}
            rows={4}
            className="input mt-1"
            placeholder="El estudiante necesita saber qué corregir (RN-5)."
          />
          {feedbackError && <p className="mt-1 text-xs font-medium text-danger">{feedbackError}</p>}
        </form>
      </Modal>
    </>
  )
}

import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'

import { clubs } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { label, statusTone } from '../../lib/enums'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InfoRow from '../../components/ui/InfoRow'
import ChipList from '../../components/ui/ChipList'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import DesktopOnly from '../../components/ui/DesktopOnly'
import { useToast } from '../../components/ui/toast-context'

/**
 * Detalle de club para GBP (30) — RF-12, RF-13, V-22.
 *
 * Muestra la ficha interna (nómina detallada, todos los documentos) y deja
 * gestionar el liderazgo: asignar por matrícula o revocar. El aviso de
 * "Pending Leader" se muestra cuando el club aún no tiene líder asignado.
 * Las acciones se difieren al escritorio (RF-54); la consulta sí es móvil.
 */
export default function ClubDetalle() {
  const { clubId } = useParams()
  const toast = useToast()

  const fetcher = useCallback(() => clubs.detail(Number(clubId)), [clubId])
  const club = useApi(fetcher)

  const [assignOpen, setAssignOpen] = useState(false)
  const [enrollment, setEnrollment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [revoking, setRevoking] = useState(false)

  const data = club.data
  const leader = data?.leader ?? null
  const statusIsPending = data?.status === 'Pending Leader'

  async function assignLeader(event) {
    event.preventDefault()
    if (!enrollment.trim()) return
    setBusy(true)
    try {
      await clubs.assignLeader(Number(clubId), enrollment.trim())
      toast.toast('Líder asignado.', 'success')
      setAssignOpen(false)
      setEnrollment('')
      club.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmRevoke() {
    setBusy(true)
    try {
      await clubs.revokeLeader(Number(clubId))
      toast.toast('Líder revocado.', 'success')
      setRevoking(false)
      club.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
      setRevoking(false)
    } finally {
      setBusy(false)
    }
  }

  const memberRows = (data?.members ?? []).map((member) => ({
    ...member,
    __stripe: member.status === 'Active' ? 'success' : 'warning',
    nombre: (
      <div>
        <div className="t-body font-medium">{member.full_name}</div>
        <div className="t-caption tabular-nums">{member.enrollment}</div>
      </div>
    ),
    estado: (
      <Badge
        text={member.status_label}
        tone={member.status === 'Active' ? 'success' : 'warning'}
      />
    ),
  }))

  const memberColumns = [
    { key: 'nombre', header: 'Miembro', mobileMain: true },
    { key: 'role_name', header: 'Rol', className: 'hidden md:table-cell' },
    { key: 'faculty', header: 'Facultad', className: 'hidden lg:table-cell' },
    { key: 'pao_period', header: 'PAO', mono: true },
    { key: 'estado', header: 'Estado', render: (row) => row.estado },
  ]

  return (
    <>
      <SectionTitle
        eyebrow="Institución"
        title={data?.name ?? 'Detalle de club'}
        description={data ? `${data.acronym} · ${data.faculty_name ?? 'Sin facultad'}` : 'Cargando…'}
      >
        {data && <Badge text={label(data.status)} tone={statusTone(data.status)} />}
      </SectionTitle>

      {club.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <>
          {statusIsPending && (
            <div className="mb-5 rounded-lg bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
              Este club está en «Pending Leader»: aún no tiene un líder activo. Asigna uno para que el panel del Líder se habilite.
            </div>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <Card
              title="Datos generales"
              actions={
                leader ? (
                  <DesktopOnly>
                    <Button variant="danger" size="sm" onClick={() => setRevoking(true)}>
                      Revocar líder
                    </Button>
                  </DesktopOnly>
                ) : null
              }
            >
              <dl>
                <InfoRow label="Nombre">{data?.name ?? '—'}</InfoRow>
                <InfoRow label="Sigla" mono>{data?.acronym ?? '—'}</InfoRow>
                <InfoRow label="Descripción">{data?.description ?? '—'}</InfoRow>
                <InfoRow label="Ubicación">{data?.location ?? '—'}</InfoRow>
                <InfoRow label="Facultad">{data?.faculty_name ?? '—'}</InfoRow>
                <InfoRow label="Áreas de interés">
                  <ChipList items={(data?.interest_areas ?? []).map((area) => area.name)} tone="primary" />
                </InfoRow>
                <InfoRow label="Líder actual">
                  {leader
                    ? `${leader.full_name} (${leader.enrollment})`
                    : 'Sin líder asignado'}
                </InfoRow>
              </dl>
              {!leader && (
                <DesktopOnly>
                  <div className="mt-4">
                    <Button size="sm" onClick={() => setAssignOpen(true)}>
                      Asignar líder
                    </Button>
                  </div>
                </DesktopOnly>
              )}
            </Card>

            <Card title="Documentos">
              {(data?.documents ?? []).length === 0 ? (
                <EmptyState
                  message="El club aún no ha subido documentos."
                  hint="Estatutos, actas o planes de trabajo en PDF."
                  width={36}
                />
              ) : (
                <ul className="divide-y divide-border">
                  {(data.documents ?? []).map((document) => (
                    <li key={document.id} className="flex items-center justify-between gap-3 py-2.5">
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="t-body font-medium text-primary underline"
                      >
                        {document.title}
                      </a>
                      <Badge
                        text={document.is_public ? 'Público' : 'Privado'}
                        tone={document.is_public ? 'success' : 'neutral'}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card
            title="Nómina interna"
            subtitle={`${(data?.members ?? []).length} membresías · solo la ve el club y GBP`}
          >
            <Table
              columns={memberColumns}
              rows={memberRows}
              rowKey="id"
              empty={
                <EmptyState
                  message="Este club aún no tiene miembros."
                  hint="La nómina aparecerá cuando se aprueben solicitudes."
                />
              }
            />
          </Card>
        </div>
        </>
      )}

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Asignar líder"
        description="Si la matrícula no tiene cuenta verificada, el club queda en «Pending Leader»."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={assignLeader} disabled={busy || !enrollment.trim()}>
              {busy ? 'Asignando…' : 'Asignar'}
            </Button>
          </>
        }
      >
        <form onSubmit={assignLeader} noValidate>
          <Field
            label="Matrícula del líder"
            name="enrollment"
            error={error}
            value={enrollment}
            onChange={(event) => setEnrollment(event.target.value)}
            placeholder="2018xxxxx"
            hint="La matrícula identifica al estudiante en ESPOL."
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={revoking}
        onClose={() => setRevoking(false)}
        onConfirm={confirmRevoke}
        title="Revocar líder"
        message={
          leader
            ? `¿Confirmas retirar a ${leader.full_name} como líder de ${data?.name ?? 'este club'}? La asignación la administra solo GBP.`
            : ''
        }
        confirmLabel="Revocar"
        danger
        busy={busy}
      />
    </>
  )
}

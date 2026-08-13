import { useCallback, useState } from 'react'

import { clubs, memberships } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { PERMISSIONS } from '../../lib/enums'
import SectionTitle from '../../components/ui/SectionTitle'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/toast-context'
import { label, statusTone } from '../../lib/enums'

/**
 * Miembros del club (19). La nómina llega completa (RN-3: solo quien tiene
 * permiso la ve); cambiar rol y dar de baja se difiere al escritorio.
 */
export default function Miembros() {
  const { ledClubId, can } = useAuth()
  const toast = useToast()

  const membersFetcher = useCallback(() => clubs.members(ledClubId), [ledClubId])
  const rolesFetcher = useCallback(() => clubs.roles(ledClubId), [ledClubId])
  const members = useApi(membersFetcher)
  const roles = useApi(rolesFetcher)

  const canManage = can(PERMISSIONS.MANAGE_MEMBERS)
  const canRoles = can(PERMISSIONS.MANAGE_ROLES)

  const [editing, setEditing] = useState(null)
  const [roleId, setRoleId] = useState('')
  const [roleError, setRoleError] = useState(null)
  const [savingRole, setSavingRole] = useState(false)

  const [revoking, setRevoking] = useState(null)
  const [revokingBusy, setRevokingBusy] = useState(false)

  function startEdit(member) {
    setEditing(member)
    setRoleId(member.role ?? '')
    setRoleError(null)
  }

  async function saveRole(event) {
    event.preventDefault()
    if (!roleId) {
      setRoleError('Selecciona el nuevo rol.')
      return
    }
    setSavingRole(true)
    try {
      await memberships.changeRole(editing.id, Number(roleId))
      toast.toast('Rol actualizado.', 'success')
      setEditing(null)
      members.reload()
    } catch (err) {
      setRoleError(err.message)
    } finally {
      setSavingRole(false)
    }
  }

  async function confirmRevoke() {
    setRevokingBusy(true)
    try {
      await memberships.revoke(revoking.id)
      toast.toast(`${revoking.full_name} ya no es miembro del club.`, 'success')
      setRevoking(null)
      members.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setRevokingBusy(false)
    }
  }

  const rows = (members.data ?? []).map((member) => ({
    ...member,
    __stripe: statusTone(member.status),
    __right: (
      <Badge text={member.status_label ?? label(member.status)} tone={statusTone(member.status)} />
    ),
    actions: canManage ? (
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => startEdit(member)}
          disabled={member.is_leadership}
          title={member.is_leadership ? 'El líder del club no cambia de rol.' : 'Cambiar rol'}
        >
          Cambiar rol
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setRevoking(member)}
          disabled={member.is_leadership}
          title={member.is_leadership ? 'El líder del club no puede darse de baja desde aquí.' : 'Dar de baja'}
        >
          Dar de baja
        </Button>
      </div>
    ) : (
      <span className="t-caption">—</span>
    ),
  }))

  const columns = [
    { key: 'full_name', header: 'Nombre', mobileMain: true },
    { key: 'enrollment', header: 'Matrícula', mono: true },
    { key: 'email', header: 'Correo', className: 'hidden md:table-cell' },
    { key: 'faculty', header: 'Facultad', className: 'hidden lg:table-cell' },
    { key: 'role_name', header: 'Rol', className: 'hidden md:table-cell' },
    { key: 'pao_period', header: 'PAO', mono: true, className: 'hidden lg:table-cell' },
    {
      key: 'status_label',
      header: 'Estado',
      className: 'hidden md:table-cell',
      // En móvil el estado ya va en el badge de la esquina de la tarjeta.
      mobile: false,
      render: (row) => <Badge text={row.status_label ?? label(row.status)} tone={statusTone(row.status)} />,
    },
    { key: 'actions', header: '', className: 'text-right', mobile: false, render: (row) => row.actions },
  ]

  return (
    <>
      <SectionTitle eyebrow="Gestión del club" title="Miembros" description="Nómina del club y vigencia por PAO." />

      {members.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          rowKey="id"
          // Matriz §4: cambiar rol y dar de baja son decisiones atómicas y sí
          // operan en móvil; ambas confirman en un Modal antes de aplicarse.
          // Sin permiso no se pinta nada: el guion de la tabla no aporta aquí.
          mobileActions={canManage ? (row) => row.actions : undefined}
          empty={
            <EmptyState
              message="Este club aún no tiene miembros."
              hint="Cuando alguien apruebe una solicitud, aparecerá aquí."
            />
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Cambiar rol"
        description={editing ? `${editing.full_name} (${editing.enrollment})` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={savingRole}>
              Cancelar
            </Button>
            <Button onClick={saveRole} disabled={savingRole}>
              {savingRole ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form onSubmit={saveRole} className="space-y-4" noValidate>
          {canRoles ? (
            <Field
              label="Nuevo rol"
              name="role"
              error={roleError}
              children={
                <select
                  name="role"
                  value={roleId}
                  onChange={(event) => setRoleId(event.target.value)}
                  className="input"
                >
                  <option value="">Selecciona…</option>
                  {(roles.data ?? []).map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              }
            />
          ) : (
            <Field
              label="Nuevo rol"
              name="role"
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              error={roleError}
              list="club-roles"
              placeholder="Escribe el nombre del rol"
            />
          )}
          {!canRoles && (
            <datalist id="club-roles">
              {(roles.data ?? []).map((role) => (
                <option key={role.id} value={role.role_name} />
              ))}
            </datalist>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={confirmRevoke}
        title="Dar de baja"
        message={
          revoking
            ? `¿Confirmas dar de baja a ${revoking.full_name} (${revoking.enrollment})? La membresía quedará como Revocada y se registrará en la bitácora.`
            : ''
        }
        confirmLabel="Dar de baja"
        danger
        busy={revokingBusy}
      />
    </>
  )
}

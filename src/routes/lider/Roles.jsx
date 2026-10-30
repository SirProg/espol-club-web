import { useCallback, useState } from 'react'

import { clubs, roles as rolesApi } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { PERMISSIONS, PERMISSION_LABELS } from '../../lib/enums'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DesktopOnly from '../../components/ui/DesktopOnly'
import { useToast } from '../../components/ui/toast-context'

const PERMISSION_KEYS = Object.values(PERMISSIONS)
const TOTAL_PERMISSIONS = PERMISSION_KEYS.length

/**
 * Roles y permisos del club (20) — RF-06, RF-07, RN-7.
 *
 * Cada club nace con cuatro roles predeterminados que no se eliminan; los
 * personalizados sí, y un rol con membresías se desactiva en vez de borrarse
 * (D-13) para conservar la nómina histórica legible. La gestión es de
 * escritorio (RF-53): la matriz de permisos es una grilla.
 */
export default function Roles() {
  const { ledClubId, can } = useAuth()
  const toast = useToast()

  const rolesFetcher = useCallback(() => clubs.roles(ledClubId), [ledClubId])
  const roles = useApi(rolesFetcher)

  const canManage = can(PERMISSIONS.MANAGE_ROLES)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ role_name: '', is_leadership: false, permissions: {} })

  const all = roles.data ?? []
  const defaults = all.filter((role) => role.is_default)
  const custom = all.filter((role) => !role.is_default)

  function openCreate() {
    setForm({ role_name: '', is_leadership: false, permissions: {} })
    setError(null)
    setCreating(true)
  }

  function openEdit(role) {
    setForm({
      role_name: role.role_name,
      is_leadership: role.is_leadership,
      permissions: Object.fromEntries(PERMISSION_KEYS.map((key) => [key, Boolean(role.permissions?.[key])])),
    })
    setError(null)
    setEditing(role)
  }

  function closeModal() {
    setCreating(false)
    setEditing(null)
    setError(null)
  }

  function setPermission(key, checked) {
    const updated = { ...form.permissions, [key]: checked }
    if (!form.is_leadership) delete updated[PERMISSIONS.MANAGE_ROLES]
    setForm({ ...form, permissions: updated })
  }

  function setLeadership(checked) {
    const permissions = { ...form.permissions }
    // RN-7: manage_roles solo para roles directivos; el servidor lo exige igual.
    if (!checked) delete permissions[PERMISSIONS.MANAGE_ROLES]
    setForm({ ...form, is_leadership: checked, permissions })
  }

  async function submit(event) {
    event.preventDefault()
    const role = editing ?? {}
    const payload = {
      role_name: form.role_name.trim(),
      is_leadership: form.is_leadership,
      permissions: Object.fromEntries(
        Object.entries(form.permissions).filter(([, value]) => value),
      ),
    }
    setBusy(true)
    try {
      if (creating) {
        await clubs.createRole(ledClubId, payload)
        toast.toast('Rol creado.', 'success')
      } else {
        await rolesApi.update(role.id, payload)
        toast.toast('Rol actualizado.', 'success')
      }
      roles.reload()
      closeModal()
    } catch (err) {
      setError(err.forField('role_name') ?? err.forField('permissions') ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      const result = await rolesApi.remove(deleting.id)
      if (result?.deactivated) {
        toast.toast('El rol tiene membresías y se desactivó.', 'success')
      } else {
        toast.toast('Rol eliminado.', 'success')
      }
      setDeleting(null)
      roles.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  const modalTitle = creating ? 'Nuevo rol' : `Editar ${editing?.role_name ?? ''}`
  const isDefault = editing?.is_default ?? false

  return (
    <>
      <SectionTitle
        eyebrow="Gestión del club"
        title="Roles y permisos"
        description="Cada club nace con cuatro roles predeterminados; los demás los crea la directiva."
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="t-caption">
          {TOTAL_PERMISSIONS} permisos por rol · RN-7: solo los roles directivos reparten permisos.
        </p>
        {canManage && (
          <DesktopOnly>
            <Button size="sm" onClick={openCreate}>
              Nuevo rol
            </Button>
          </DesktopOnly>
        )}
      </div>

      {roles.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <SubsectionTitle hint="No se pueden eliminar">Roles predeterminados</SubsectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              {defaults.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  canManage={canManage}
                  onEdit={() => openEdit(role)}
                />
              ))}
            </div>
          </section>

          <section>
            <SubsectionTitle hint="Creados por la directiva">Roles personalizados</SubsectionTitle>
            {custom.length === 0 ? (
              <p className="t-caption rounded-lg bg-surface px-4 py-3 ring-1 ring-border">
                Aún no has creado roles personalizados.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {custom.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    canManage={canManage}
                    onEdit={() => openEdit(role)}
                    onDelete={() => setDeleting(role)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <Modal
        open={creating || Boolean(editing)}
        onClose={closeModal}
        title={modalTitle}
        description={
          isDefault
            ? 'Los roles predeterminados no cambian de nombre ni de condición; solo sus permisos.'
            : undefined
        }
        wide
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field
            label="Nombre del rol"
            name="role_name"
            value={form.role_name}
            onChange={(event) => setForm({ ...form, role_name: event.target.value })}
            disabled={isDefault}
            error={isDefault ? null : error}
            required
          />

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_leadership}
              onChange={(event) => setLeadership(event.target.checked)}
              disabled={isDefault}
              className="mt-0.5 checkbox"
            />
            <span>
              <span className="font-semibold">Rol directivo</span>
              <span className="t-caption block">
                La directiva ve la nómina y puede repartir permisos (RN-7).
              </span>
            </span>
          </label>

          <div>
            <p className="t-label mb-2">Permisos</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {PERMISSION_KEYS.map((key) => {
                const disabled = key === PERMISSIONS.MANAGE_ROLES && !form.is_leadership
                return (
                  <li key={key}>
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(form.permissions[key])}
                        onChange={(event) => setPermission(key, event.target.checked)}
                        disabled={disabled}
                        className="mt-0.5 checkbox"
                      />
                      <span className="min-w-0">
                        <span className="font-medium">{PERMISSION_LABELS[key]}</span>
                        {disabled && (
                          <span className="t-caption block">
                            Solo para roles directivos
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
            {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Eliminar rol"
        message={
          deleting
            ? `¿Confirmas eliminar el rol "${deleting.role_name}"? Si tiene membresías asociadas, se desactivará para conservar el historial.`
            : ''
        }
        confirmLabel="Eliminar"
        danger
        busy={busy}
      />
    </>
  )
}

function RoleCard({ role, canManage, onEdit, onDelete }) {
  const granted = role.granted_permissions ?? []
  return (
    <Card
      title={role.role_name}
      subtitle={`${role.members_count} ${role.members_count === 1 ? 'miembro' : 'miembros'} · ${granted.length} de ${TOTAL_PERMISSIONS} permisos`}
      tone={role.is_active ? undefined : 'warning'}
      right={
        <>
          <Badge text={role.is_leadership ? 'Directivo' : 'Base'} tone={role.is_leadership ? 'success' : 'neutral'} />
          {!role.is_active && <Badge text="Desactivado" tone="warning" />}
        </>
      }
      actions={
        canManage ? (
          <DesktopOnly>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onEdit}>
                Editar
              </Button>
              {onDelete && !role.is_default && (
                <Button variant="danger" size="sm" onClick={onDelete}>
                  Eliminar
                </Button>
              )}
            </div>
          </DesktopOnly>
        ) : null
      }
    >
      <p className="t-caption">Permisos:</p>
      <ul className="mt-1 space-y-0.5">
        {granted.length === 0 ? (
          <li className="t-caption">—</li>
        ) : (
          granted.map((key) => (
            <li key={key} className="t-body">
              <span className="text-primary">·</span> {PERMISSION_LABELS[key] ?? key}
            </li>
          ))
        )}
      </ul>
    </Card>
  )
}

function SubsectionTitle({ hint, children }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="t-heading">{children}</h2>
      {hint && <span className="t-caption">{hint}</span>}
    </div>
  )
}

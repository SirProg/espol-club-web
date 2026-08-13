import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { clubs, events } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { ROUTES } from '../../routing/modules'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/toast-context'

/**
 * Staff del evento (25) — RF-35.
 *
 * El staff sale de la nómina activa del club (invariante I-20). La asignación
 * reemplaza el conjunto completo: marcas quiénes quedan y se guarda todo de
 * una vez. La lista de selección sí se permite desde el móvil (matriz §4).
 */
export default function EventoStaff() {
  const { eventId } = useParams()
  const { ledClubId } = useAuth()
  const toast = useToast()

  const eventFetcher = useCallback(() => events.detail(Number(eventId)), [eventId])
  const staffFetcher = useCallback(() => events.staff(Number(eventId)), [eventId])
  const membersFetcher = useCallback(() => clubs.members(ledClubId), [ledClubId])

  const event = useApi(eventFetcher)
  const staff = useApi(staffFetcher)
  const members = useApi(membersFetcher)

  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const assignedIds = useMemo(
    () => new Set((staff.data ?? []).map((item) => item.student_id)),
    [staff.data],
  )

  // `selected` es null hasta que el líder toca una casilla: en ese momento
  // parte de lo asignado y se edita sobre eso. La asignación reemplaza todo.
  const effective = selected ?? assignedIds

  const candidates = (members.data ?? []).filter((member) => !member.is_leadership)

  function toggle(studentId) {
    const base = selected ?? new Set(assignedIds)
    const next = new Set(base)
    if (next.has(studentId)) next.delete(studentId)
    else next.add(studentId)
    setSelected(next)
  }

  async function save() {
    setSaving(true)
    try {
      await events.setStaff(Number(eventId), [...effective])
      toast.toast('Staff actualizado.', 'success')
      setSelected(null)
      staff.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  const loading = event.loading || staff.loading || members.loading

  return (
    <>
      <SectionTitle
        eyebrow="Gestión del club"
        title="Staff del evento"
        description={event.data ? event.data.event_name : 'Cargando…'}
      >
        <Link to={ROUTES.LIDER_EVENTOS} className="t-caption text-primary underline">
          Volver a eventos
        </Link>
      </SectionTitle>

      {loading ? (
        <p className="t-caption">Cargando…</p>
      ) : candidates.length === 0 ? (
        <EmptyState
          message="No hay miembros disponibles para asignar."
          hint="Solo los miembros activos sin rol directivo pueden ser staff."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            title="Disponibles"
            subtitle={`${candidates.length} ${candidates.length === 1 ? 'miembro' : 'miembros'} de la nómina activa`}
          >
            <ul className="divide-y divide-border">
              {candidates.map((member) => {
                const checked = effective.has(member.student_id)
                return (
                  <li key={member.id}>
                    <label className="flex cursor-pointer items-center gap-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(member.student_id)}
                        className="checkbox"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="t-body block font-medium">{member.full_name}</span>
                        <span className="t-caption">{member.enrollment} · {member.email}</span>
                      </span>
                      <Badge text={checked ? 'Asignado' : 'Disponible'} tone={checked ? 'success' : 'neutral'} />
                    </label>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 border-t border-border pt-3">
              <Button onClick={save} disabled={saving || !effective.size}>
                {saving ? 'Guardando…' : `Guardar asignación (${effective.size})`}
              </Button>
            </div>
          </Card>

          <Card
            title="Asignados"
            subtitle="Quienes escanean credenciales durante el evento."
            tone="success"
          >
            {(staff.data ?? []).length === 0 ? (
              <EmptyState
                message="Aún no hay staff asignado."
                hint="Marca miembros a la izquierda y guarda la asignación."
                width={36}
              />
            ) : (
              <ul className="divide-y divide-border">
                {(staff.data ?? []).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="t-body font-medium">{item.full_name}</p>
                      <p className="t-caption">{item.enrollment}</p>
                    </div>
                    <Badge text="Staff" tone="success" />
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

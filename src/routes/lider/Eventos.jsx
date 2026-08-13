import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { events, forms } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { EVENT_MODES, EVENT_VISIBILITY, PERMISSIONS } from '../../lib/enums'
import { label } from '../../lib/enums'
import { fmtDateTime, toDateInput, toDateTimeInput } from '../../lib/format'
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

const EMPTY_FORM = {
  event_name: '',
  mode: 'In-person',
  planned_date: '',
  planned_hour: '',
  end_datetime: '',
  planned_place: '',
  description: '',
  marketing_image: '',
  visibility: 'Public',
  registration_form_id: '',
  registration_deadline: '',
  blocked_message: '',
  expected_participants: '',
}

/**
 * Gestión de eventos del club (23-24) — RF-30 a RF-33, RF-38.
 *
 * La tabla muestra inscritos vs. asistentes (V-17); la creación, la edición y
 * el borrado se difieren al escritorio (matriz §4). La asignación de staff
 * vive en su propia pantalla (25).
 */
export default function Eventos() {
  const { ledClubId, can } = useAuth()
  const toast = useToast()

  const eventsFetcher = useCallback(() => events.listByClub(ledClubId), [ledClubId])
  const formsFetcher = useCallback(() => forms.list(ledClubId, { form_type: 'Event' }), [ledClubId])
  const eventData = useApi(eventsFetcher)
  const eventForms = useApi(formsFetcher)

  const canManage = can(PERMISSIONS.MANAGE_EVENTS)

  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  function openCreate() {
    setForm(EMPTY_FORM)
    setError(null)
    setCreating(true)
  }

  function openEdit(event) {
    setForm({
      event_name: event.event_name ?? '',
      mode: event.mode ?? 'In-person',
      planned_date: toDateInput(event.planned_date),
      planned_hour: event.planned_hour?.slice(0, 5) ?? '',
      end_datetime: toDateTimeInput(event.end_datetime),
      planned_place: event.planned_place ?? '',
      description: event.description ?? '',
      marketing_image: event.marketing_image ?? '',
      visibility: event.visibility ?? 'Public',
      registration_form_id: event.registration_form ?? '',
      registration_deadline: toDateTimeInput(event.registration_deadline),
      blocked_message: event.blocked_message ?? '',
      expected_participants: event.expected_participants ?? '',
    })
    setError(null)
    setEditing(event)
  }

  function closeModal() {
    setCreating(false)
    setEditing(null)
    setError(null)
  }

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const payload = {
      event_name: form.event_name.trim(),
      mode: form.mode,
      planned_date: form.planned_date,
      planned_hour: form.planned_hour,
      end_datetime: form.end_datetime,
      planned_place: form.planned_place.trim(),
      description: form.description.trim(),
      marketing_image: form.marketing_image.trim(),
      visibility: form.visibility,
      registration_form_id: form.registration_form_id ? Number(form.registration_form_id) : null,
      registration_deadline: form.registration_deadline || null,
      blocked_message: form.blocked_message.trim(),
      expected_participants: form.expected_participants ? Number(form.expected_participants) : null,
    }
    setBusy(true)
    try {
      if (creating) {
        await events.create(ledClubId, payload)
        toast.toast('Evento creado.', 'success')
      } else {
        await events.update(editing.id, payload)
        toast.toast('Evento actualizado.', 'success')
      }
      eventData.reload()
      closeModal()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await events.remove(deleting.id)
      toast.toast('Evento eliminado.', 'success')
      setDeleting(null)
      eventData.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const rows = (eventData.data ?? []).map((event) => ({
    ...event,
    __stripe: event.registration_is_open ? 'success' : 'warning',
    __right: (
      <Badge
        text={event.registration_is_open ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
        tone={event.registration_is_open ? 'success' : 'warning'}
      />
    ),
    actions: canManage ? (
      <div className="flex items-center gap-2">
        <Link
          to={`staff/${event.id}`}
          className="inline-flex min-h-11 items-center rounded-md px-3 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-soft md:min-h-0 md:h-8"
        >
          Staff
        </Link>
        <Button variant="secondary" size="sm" onClick={() => openEdit(event)}>
          Editar
        </Button>
        <Button variant="danger" size="sm" onClick={() => setDeleting(event)}>
          Eliminar
        </Button>
      </div>
    ) : (
      <span className="t-caption">—</span>
    ),
  }))

  const columns = [
    { key: 'event_name', header: 'Evento', mobileMain: true },
    {
      key: 'start_datetime',
      header: 'Inicio',
      mono: true,
      className: 'hidden md:table-cell',
      render: (row) => fmtDateTime(row.start_datetime),
    },
    { key: 'mode_label', header: 'Modalidad', className: 'hidden lg:table-cell' },
    { key: 'planned_place', header: 'Lugar', className: 'hidden lg:table-cell' },
    {
      key: 'stats',
      header: 'Inscritos / Asistieron',
      mono: true,
      render: (row) => `${row.stats?.registered ?? 0} / ${row.stats?.attended ?? 0}`,
    },
    {
      key: 'visibility',
      header: 'Visibilidad',
      render: (row) => (
        <Badge text={label(row.visibility)} tone={row.visibility === 'Public' ? 'success' : 'warning'} />
      ),
    },
    { key: 'actions', header: '', className: 'text-right', mobile: false, render: (row) => row.actions },
  ]

  return (
    <>
      <SectionTitle
        eyebrow="Gestión del club"
        title="Eventos"
        description="Actividades del club con su desempeño de inscripción y asistencia."
      >
        {canManage && (
          <DesktopOnly>
            <Button size="sm" onClick={openCreate}>
              Crear evento
            </Button>
          </DesktopOnly>
        )}
      </SectionTitle>

      {eventData.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          rowKey="id"
          empty={
            <EmptyState
              message="Este club aún no ha creado eventos."
              hint="Usa «Crear evento» para programar una actividad."
            />
          }
        />
      )}

      <Modal
        open={creating || Boolean(editing)}
        onClose={closeModal}
        title={creating ? 'Crear evento' : 'Editar evento'}
        description="Fecha y hora se combinan en el inicio del evento."
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
            label="Nombre del evento"
            name="event_name"
            value={form.event_name}
            onChange={(event) => setValue('event_name', event.target.value)}
            error={error}
            required
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Modalidad"
              name="mode"
              className="gap-1"
              children={
                <select
                  name="mode"
                  value={form.mode}
                  onChange={(event) => setValue('mode', event.target.value)}
                  className="input"
                >
                  {EVENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {label(mode)}
                    </option>
                  ))}
                </select>
              }
            />
            <Field
              label="Visibilidad"
              name="visibility"
              className="gap-1"
              children={
                <select
                  name="visibility"
                  value={form.visibility}
                  onChange={(event) => setValue('visibility', event.target.value)}
                  className="input"
                >
                  {EVENT_VISIBILITY.map((visibility) => (
                    <option key={visibility} value={visibility}>
                      {label(visibility)}
                    </option>
                  ))}
                </select>
              }
            />
            <Field
              label="Participantes esperados"
              name="expected_participants"
              type="number"
              min="0"
              value={form.expected_participants}
              onChange={(event) => setValue('expected_participants', event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Fecha"
              name="planned_date"
              type="date"
              value={form.planned_date}
              onChange={(event) => setValue('planned_date', event.target.value)}
              required
            />
            <Field
              label="Hora"
              name="planned_hour"
              type="time"
              value={form.planned_hour}
              onChange={(event) => setValue('planned_hour', event.target.value)}
              required
            />
            <Field
              label="Fin"
              name="end_datetime"
              type="datetime-local"
              value={form.end_datetime}
              onChange={(event) => setValue('end_datetime', event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Lugar"
              name="planned_place"
              value={form.planned_place}
              onChange={(event) => setValue('planned_place', event.target.value)}
              required
            />
            <Field
              label="Imagen (URL)"
              name="marketing_image"
              value={form.marketing_image}
              onChange={(event) => setValue('marketing_image', event.target.value)}
              placeholder="https://…"
            />
          </div>

          <Field
            label="Descripción"
            name="description"
            children={
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={(event) => setValue('description', event.target.value)}
                className="input min-h-11"
              />
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Formulario de inscripción"
              name="registration_form_id"
              className="gap-1"
              hint="Opcional: sin formulario, el registro queda cerrado."
              children={
                <select
                  name="registration_form_id"
                  value={form.registration_form_id}
                  onChange={(event) => setValue('registration_form_id', event.target.value)}
                  className="input"
                >
                  <option value="">Sin formulario</option>
                  {(eventForms.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} (v{item.version})
                    </option>
                  ))}
                </select>
              }
            />
            <Field
              label="Cierre de inscripción"
              name="registration_deadline"
              type="datetime-local"
              value={form.registration_deadline}
              onChange={(event) => setValue('registration_deadline', event.target.value)}
            />
          </div>

          <Field
            label="Mensaje de bloqueo"
            name="blocked_message"
            value={form.blocked_message}
            onChange={(event) => setValue('blocked_message', event.target.value)}
            hint="Texto que ve el estudiante cuando el registro está cerrado."
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Eliminar evento"
        message={
          deleting
            ? `¿Confirmas eliminar "${deleting.event_name}"? Si tiene inscripciones, el servidor lo rechazará para conservar la evidencia.`
            : ''
        }
        confirmLabel="Eliminar"
        danger
        busy={busy}
      />
    </>
  )
}

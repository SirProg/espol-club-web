import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { events, forms } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { ROUTES } from '../../routing/modules'
import { label } from '../../lib/enums'
import { fmtDateTime } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import InfoRow from '../../components/ui/InfoRow'
import Modal from '../../components/ui/Modal'
import DynamicForm from '../../components/forms/DynamicForm'
import { useToast } from '../../components/ui/toast-context'

/**
 * Detalle de evento (10) e inscripción (11) — V-05, F-06.
 *
 * Las dos pantallas viven juntas porque la inscripción es un paso del evento,
 * no un destino aparte: el formulario se abre en un diálogo sobre el detalle y
 * al confirmar devuelve la credencial (12).
 *
 * Quién puede inscribirse lo decide el servidor en `can_register`, con su
 * motivo. Los códigos son `already_registered`, `no_registration_form`,
 * `members_only` y `registration_closed`.
 */
export default function EventoDetalle() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const eventFetcher = useCallback(() => events.detail(eventId), [eventId])
  const evento = useApi(eventFetcher)

  const [abierto, setAbierto] = useState(false)
  const [esquema, setEsquema] = useState(null)
  const [cargandoEsquema, setCargandoEsquema] = useState(false)
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const data = evento.data
  const puede = data?.can_register

  async function abrirInscripcion() {
    setAbierto(true)
    setValues({})
    setErrors({})
    // El esquema se pide al abrir, no al cargar la pantalla: la mayoría de las
    // visitas son para mirar el evento, no para inscribirse.
    if (!esquema && data?.registration_form) {
      setCargandoEsquema(true)
      try {
        setEsquema(await forms.detail(data.registration_form))
      } catch {
        setEsquema({ fields: [] })
      } finally {
        setCargandoEsquema(false)
      }
    }
  }

  function set(fieldId, value) {
    setValues((current) => ({ ...current, [fieldId]: value }))
    setErrors((current) => ({ ...current, [fieldId]: undefined }))
  }

  async function confirmar(event) {
    event.preventDefault()
    const campos = esquema?.fields ?? []
    const problemas = {}
    for (const campo of campos) {
      if (!campo.required) continue
      const valor = values[campo.field_id]
      const vacio =
        valor === undefined ||
        valor === null ||
        valor === '' ||
        (Array.isArray(valor) && valor.length === 0)
      if (vacio) problemas[campo.field_id] = 'Esta respuesta es obligatoria.'
    }
    if (Object.keys(problemas).length > 0) {
      setErrors(problemas)
      return
    }

    setBusy(true)
    try {
      await events.register(eventId, values)
      toast.toast('Listo. Tu credencial ya está disponible.', 'success')
      navigate(ROUTES.APP_CREDENCIALES)
    } catch (err) {
      const porCampo = err.errors ?? (err.field ? { [err.field]: err.message } : null)
      if (porCampo) {
        setErrors(
          Object.fromEntries(
            Object.entries(porCampo).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.join(' ') : String(value),
            ]),
          ),
        )
      }
      toast.toast(err.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  if (evento.loading) return <p className="t-caption">Cargando…</p>
  if (evento.error) return <p className="text-sm text-danger">No se pudo cargar este evento.</p>

  return (
    <>
      <SectionTitle eyebrow="Eventos" title={data.event_name} description={data.club_name}>
        <Link to={ROUTES.APP_EVENTOS} className="t-caption underline underline-offset-2">
          Volver a eventos
        </Link>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card tone={data.registration_is_open ? 'success' : 'neutral'}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                text={data.mode_label ?? label(data.mode)}
                tone="neutral"
              />
              <Badge
                text={data.visibility_label ?? label(data.visibility)}
                tone={data.visibility === 'MembersOnly' ? 'warning' : 'neutral'}
              />
            </div>

            <p className="t-body mt-4 text-ink-muted">
              {data.description || 'Este evento aún no tiene descripción.'}
            </p>

            <dl className="mt-4 border-t border-border pt-2">
              <InfoRow label="Comienza" value={fmtDateTime(data.start_datetime)} mono />
              <InfoRow label="Termina" value={fmtDateTime(data.end_datetime)} mono />
              <InfoRow label="Lugar" value={data.planned_place || '—'} />
              <InfoRow label="Organiza" value={data.club_name} />
              {data.registration_deadline && (
                <InfoRow
                  label="Inscripción hasta"
                  value={fmtDateTime(data.registration_deadline)}
                  mono
                />
              )}
              {data.expected_participants ? (
                <InfoRow label="Cupo previsto" value={String(data.expected_participants)} mono />
              ) : null}
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Inscripción">
            {puede?.can_register ? (
              <>
                <p className="t-body text-ink-muted">
                  Al inscribirte se genera tu credencial QR para marcar asistencia.
                </p>
                <div className="mt-4">
                  <Button onClick={abrirInscripcion}>Inscribirme</Button>
                </div>
              </>
            ) : (
              <>
                <p className="t-body text-ink-muted">
                  {puede?.reason ?? 'La inscripción no está disponible.'}
                </p>

                {/* El líder puede dejar escrito un mensaje propio para cuando
                    el registro está cerrado o el evento es solo de miembros. */}
                {data.blocked_message &&
                  (puede?.code === 'members_only' || puede?.code === 'registration_closed') && (
                    <p className="t-caption mt-3 rounded-[10px] bg-surface-alt px-3 py-2">
                      {data.blocked_message}
                    </p>
                  )}

                {puede?.code === 'already_registered' && (
                  <div className="mt-4">
                    <Link to={ROUTES.APP_CREDENCIALES}>
                      <Button variant="secondary">Ver mi credencial</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </Card>

          {data.stats && (
            <Card title="Participación">
              <dl>
                <InfoRow label="Inscritos" value={String(data.stats.registered)} mono />
                <InfoRow label="Asistieron" value={String(data.stats.attended)} mono />
              </dl>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={abierto}
        onClose={() => setAbierto(false)}
        title="Inscripción al evento"
        description={data.event_name}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setAbierto(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={confirmar} disabled={busy || cargandoEsquema}>
              {busy ? 'Confirmando…' : 'Confirmar inscripción'}
            </Button>
          </>
        }
      >
        {cargandoEsquema ? (
          <p className="t-caption">Cargando el formulario…</p>
        ) : (
          <form onSubmit={confirmar} noValidate>
            {(esquema?.fields ?? []).length === 0 ? (
              <p className="t-body text-ink-muted">
                Este evento no pide datos adicionales. Confirma para generar tu credencial.
              </p>
            ) : (
              <DynamicForm
                fields={esquema.fields}
                values={values}
                errors={errors}
                onChange={set}
                disabled={busy}
              />
            )}
          </form>
        )}
      </Modal>
    </>
  )
}

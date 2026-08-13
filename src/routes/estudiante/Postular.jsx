import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { applications, clubs, forms } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { ROUTES } from '../../routing/modules'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import DynamicForm from '../../components/forms/DynamicForm'
import { useToast } from '../../components/ui/toast-context'

/**
 * Formulario de postulación (8) — F-05.
 *
 * El esquema lo publica cada club, así que el formulario se dibuja con
 * `DynamicForm` a partir de `fields[]`. La validación de aquí es cortesía: la
 * que cuenta es la del servidor, y sus errores se devuelven por campo.
 *
 * RN-2 (ya eres miembro, ya tienes una postulación pendiente) la comprueba
 * `can-apply` antes de llegar hasta aquí, pero se vuelve a mirar por si alguien
 * entra con la URL directa.
 */
export default function Postular() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const clubFetcher = useCallback(() => clubs.detail(clubId), [clubId])
  const formFetcher = useCallback(() => forms.membershipForm(clubId), [clubId])
  const canApplyFetcher = useCallback(() => applications.canApply(clubId), [clubId])

  const club = useApi(clubFetcher)
  const form = useApi(formFetcher)
  const canApply = useApi(canApplyFetcher)

  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  function set(fieldId, value) {
    setValues((current) => ({ ...current, [fieldId]: value }))
    setErrors((current) => ({ ...current, [fieldId]: undefined }))
  }

  function validar(campos) {
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
    return problemas
  }

  async function submit(event) {
    event.preventDefault()
    const campos = form.data?.fields ?? []
    const problemas = validar(campos)
    if (Object.keys(problemas).length > 0) {
      setErrors(problemas)
      return
    }

    setBusy(true)
    try {
      await applications.submit(clubId, values)
      toast.toast('Tu postulación fue enviada. Te avisaremos cuando la revisen.', 'success')
      navigate(ROUTES.APP_HISTORIAL)
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

  if (club.loading || form.loading || canApply.loading) {
    return <p className="t-caption">Cargando…</p>
  }

  const volver = (
    <Link
      to={ROUTES.APP_CLUB.replace(':clubId', clubId)}
      className="t-caption underline underline-offset-2"
    >
      Volver al club
    </Link>
  )

  // El club aún no publicó formulario de postulación: no hay nada que rellenar.
  if (form.error) {
    return (
      <>
        <SectionTitle eyebrow="Clubes" title="Postulación">
          {volver}
        </SectionTitle>
        <Card>
          <p className="t-body text-ink-muted">
            {club.data?.name} todavía no ha publicado su formulario de postulación. Vuelve
            a intentarlo más adelante.
          </p>
        </Card>
      </>
    )
  }

  if (canApply.data && !canApply.data.allowed) {
    return (
      <>
        <SectionTitle eyebrow="Clubes" title="Postulación">
          {volver}
        </SectionTitle>
        <Card>
          <p className="t-body text-ink-muted">{canApply.data.reason}</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <SectionTitle
        eyebrow="Clubes"
        title={`Postular a ${club.data?.acronym ?? ''}`}
        description={form.data?.title}
      >
        {volver}
      </SectionTitle>

      <div className="max-w-2xl">
        <Card>
          <form onSubmit={submit} noValidate className="space-y-5">
            <DynamicForm
              fields={form.data?.fields ?? []}
              values={values}
              errors={errors}
              onChange={set}
              disabled={busy}
            />
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
              <p className="t-caption mr-auto">
                Tus respuestas las verá la directiva de {club.data?.acronym}.
              </p>
              <Button type="submit" disabled={busy}>
                {busy ? 'Enviando…' : 'Enviar postulación'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  )
}

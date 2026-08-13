import { useCallback, useState } from 'react'

import { forms } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { FIELD_TYPES, FIELD_TYPES_WITH_OPTIONS, PERMISSIONS } from '../../lib/enums'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import DesktopOnly from '../../components/ui/DesktopOnly'
import DynamicForm from '../../components/forms/DynamicForm'
import { useToast } from '../../components/ui/toast-context'
import { label } from '../../lib/enums'

const TYPE_LABELS = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t.label]))

function blankField(index) {
  return { field_id: `f${index + 1}`, label: '', type: 'text', required: false, options: [] }
}

/**
 * Formularios del club (22) — RF-22, RF-24, RF-27.
 *
 * Un formulario con respuestas es inmutable: editarlo genera una versión nueva
 * y desactiva la anterior, conservando el histórico. El constructor solo está
 * disponible en escritorio (RF-53).
 */
export default function Formularios() {
  const { ledClubId, can } = useAuth()
  const toast = useToast()

  const formsFetcher = useCallback(() => forms.list(ledClubId), [ledClubId])
  const allForms = useApi(formsFetcher)

  const canManage = can(PERMISSIONS.MANAGE_FORMS)

  const [builder, setBuilder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // La vista previa es un formulario de verdad: se rellena para comprobar que
  // las opciones y los tipos se comportan como el líder espera.
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewValues, setPreviewValues] = useState({})
  const [previewErrors, setPreviewErrors] = useState({})
  const [checking, setChecking] = useState(false)

  /**
   * Contrasta las respuestas de la vista previa contra el esquema **en el
   * servidor** (`POST /forms/{id}/validate/`). La validación de cliente es
   * orientativa; la que manda es esta, y así el líder comprueba que su
   * formulario se comporta antes de que lo use un estudiante.
   *
   * Solo existe para formularios ya guardados: uno en creación aún no tiene id.
   */
  async function checkPreview() {
    if (!builder?.formId) return
    setChecking(true)
    setPreviewErrors({})
    try {
      await forms.validate(builder.formId, previewValues)
      toast.toast('El servidor acepta estas respuestas.', 'success')
    } catch (err) {
      // El sobre de error trae `errors` por campo cuando el fallo es del cuerpo.
      const byField = err.errors ?? (err.field ? { [err.field]: err.message } : null)
      if (byField) {
        setPreviewErrors(
          Object.fromEntries(
            Object.entries(byField).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.join(' ') : String(value),
            ]),
          ),
        )
      }
      toast.toast(err.message, 'danger')
    } finally {
      setChecking(false)
    }
  }

  const list = (allForms.data ?? []).sort(
    (a, b) => String(b.form_type).localeCompare(String(a.form_type)) || b.version - a.version,
  )

  function openCreate() {
    setBuilder({ mode: 'create', form: { form_type: 'Membership', title: '', fields: [blankField(0)] } })
    setError(null)
  }

  function openEdit(form) {
    setBuilder({
      mode: form.is_editable ? 'edit' : 'version',
      formId: form.id,
      form: {
        form_type: form.form_type,
        title: form.title,
        fields: (form.fields ?? []).map((field) => ({ ...field, options: [...(field.options ?? [])] })),
      },
    })
    setError(null)
  }

  function closeBuilder() {
    setBuilder(null)
    setError(null)
    setPreviewOpen(false)
    setPreviewValues({})
  }

  function updateField(index, patch) {
    setBuilder((current) => {
      const fields = current.form.fields.map((field, i) => (i === index ? { ...field, ...patch } : field))
      return { ...current, form: { ...current.form, fields } }
    })
  }

  function addField() {
    setBuilder((current) => ({
      ...current,
      form: {
        ...current.form,
        fields: [...current.form.fields, blankField(current.form.fields.length)],
      },
    }))
  }

  function removeField(index) {
    setBuilder((current) => ({
      ...current,
      form: {
        ...current.form,
        fields: current.form.fields
          .filter((_, i) => i !== index)
          .map((field, i) => ({ ...field, field_id: `f${i + 1}` })),
      },
    }))
  }

  function validate(field) {
    if (!field.label.trim()) return 'Cada campo necesita una etiqueta.'
    if (FIELD_TYPES_WITH_OPTIONS.includes(field.type) && field.options.length < 2) {
      return 'Los campos de opciones requieren al menos dos opciones.'
    }
    return null
  }

  async function submit(event) {
    event.preventDefault()
    const formData = builder.form
    for (const field of formData.fields) {
      const problem = validate(field)
      if (problem) {
        setError(problem)
        return
      }
    }
    const payload = {
      form_type: formData.form_type,
      title: formData.title.trim(),
      fields: formData.fields.map((field, index) => ({
        field_id: field.field_id || `f${index + 1}`,
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        order: index,
        options: field.options,
        validation: field.validation ?? {},
      })),
    }
    setBusy(true)
    try {
      if (builder.mode === 'create') {
        await forms.create(ledClubId, payload)
        toast.toast('Formulario publicado.', 'success')
      } else if (builder.mode === 'edit') {
        await forms.update(builder.formId, { title: payload.title, fields: payload.fields })
        toast.toast('Formulario actualizado.', 'success')
      } else {
        await forms.createVersion(builder.formId, { title: payload.title, fields: payload.fields })
        toast.toast('Nueva versión publicada.', 'success')
      }
      allForms.reload()
      closeBuilder()
    } catch (err) {
      setError(err.forField('fields') ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(form) {
    try {
      if (form.is_active) {
        await forms.deactivate(form.id)
        toast.toast('Formulario desactivado.', 'success')
      } else {
        await forms.activate(form.id)
        toast.toast('Formulario activado.', 'success')
      }
      allForms.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    }
  }

  const modalTitle =
    builder?.mode === 'create'
      ? 'Nuevo formulario'
      : builder?.mode === 'edit'
        ? `Editar ${builder?.form?.title || ''}`
        : `Nueva versión de ${builder?.form?.title || ''}`

  return (
    <>
      <SectionTitle
        eyebrow="Gestión del club"
        title="Formularios"
        description="Esquemas de postulación y de inscripción que usa el club."
      >
        {canManage && (
          <DesktopOnly>
            <Button size="sm" onClick={openCreate}>
              Nuevo formulario
            </Button>
          </DesktopOnly>
        )}
      </SectionTitle>

      {allForms.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : list.length === 0 ? (
        <EmptyState
          message="El club aún no ha creado formularios."
          hint="Los usan los estudiantes para postular o inscribirse a eventos."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((form) => (
            <Card
              key={form.id}
              title={form.title}
              subtitle={`${label(form.form_type)} · versión ${form.version} · ${form.response_count} ${form.response_count === 1 ? 'respuesta' : 'respuestas'}`}
              tone={form.is_active ? 'success' : 'neutral'}
              right={<Badge text={form.is_active ? 'Activo' : 'Inactivo'} tone={form.is_active ? 'success' : 'warning'} />}
              actions={
                canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(form)}>
                      {form.is_editable ? 'Editar' : 'Nueva versión'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleActive(form)}>
                      {form.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                ) : null
              }
            >
              {!form.is_editable && (
                <p className="t-caption mb-2 text-warning">
                  Tiene respuestas: editarlo crea una versión nueva.
                </p>
              )}
              <ul className="space-y-1">
                {(form.fields ?? []).map((field) => (
                  <li key={field.field_id} className="flex items-baseline justify-between gap-3">
                    <span className="t-body min-w-0">
                      {field.required ? <span className="text-danger">*</span> : null} {field.label}
                    </span>
                    <span className="t-caption shrink-0">
                      {TYPE_LABELS[field.type] ?? field.type}
                      {field.options?.length > 0 ? ` · ${field.options.length} opciones` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(builder)}
        onClose={closeBuilder}
        title={modalTitle}
        description={
          builder?.mode === 'version'
            ? 'La versión anterior quedará desactivada pero no se borra.'
            : 'El servidor solo acepta campos con etiqueta y opciones cuando el tipo lo requiere.'
        }
        wide
        footer={
          <>
            <Button variant="secondary" onClick={closeBuilder} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? 'Publicando…' : builder?.mode === 'create' ? 'Publicar' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Título"
              name="title"
              value={builder?.form.title ?? ''}
              onChange={(event) =>
                setBuilder((current) => ({
                  ...current,
                  form: { ...current.form, title: event.target.value },
                }))
              }
              error={error && !error.includes('campo') ? error : null}
              required
            />
            <Field
              label="Tipo"
              name="form_type"
              className="gap-1"
              children={
                <select
                  name="form_type"
                  value={builder?.form.form_type ?? 'Membership'}
                  onChange={(event) =>
                    setBuilder((current) => ({
                      ...current,
                      form: { ...current.form, form_type: event.target.value },
                    }))
                  }
                  className="input"
                >
                  <option value="Membership">Postulación</option>
                  <option value="Event">Inscripción a evento</option>
                </select>
              }
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="t-label">Campos</p>
              <Button variant="secondary" size="sm" onClick={addField} type="button">
                Añadir campo
              </Button>
            </div>
            {builder?.form.fields.length === 0 && (
              <p className="t-caption">Aún no has añadido campos.</p>
            )}
            <ul className="space-y-3">
              {(builder?.form.fields ?? []).map((field, index) => (
                <FieldEditor
                  key={index}
                  field={field}
                  index={index}
                  onChange={(patch) => updateField(index, patch)}
                  onRemove={() => removeField(index)}
                />
              ))}
            </ul>
          </div>

          {/* Lo que verá el estudiante. Publicar a ciegas es la forma más fácil
              de publicar una pregunta mal redactada. */}
          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="t-label">Vista previa</p>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setPreviewOpen((current) => !current)}
              >
                {previewOpen ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
            {previewOpen && (
              <div className="space-y-3 rounded-[10px] bg-surface-alt p-4">
                <DynamicForm
                  fields={builder?.form.fields ?? []}
                  values={previewValues}
                  errors={previewErrors}
                  onChange={(fieldId, value) => {
                    setPreviewValues((current) => ({ ...current, [fieldId]: value }))
                    setPreviewErrors((current) => ({ ...current, [fieldId]: undefined }))
                  }}
                />
                {builder?.formId && (
                  <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
                    <span className="t-caption">
                      Contrasta las respuestas contra el esquema en el servidor.
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={checkPreview}
                      disabled={checking}
                    >
                      {checking ? 'Comprobando…' : 'Comprobar'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-xs font-medium text-danger">{error}</p>}
        </form>
      </Modal>
    </>
  )
}

function FieldEditor({ field, index, onChange, onRemove }) {
  const needsOptions = FIELD_TYPES_WITH_OPTIONS.includes(field.type)
  return (
    <li className="rounded-[10px] bg-surface-alt/50 p-3 ring-1 ring-border">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={`Etiqueta del campo ${index + 1}`}
          name={`label-${index}`}
          value={field.label}
          onChange={(event) => onChange({ label: event.target.value })}
          required
        />
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
          <Field
            label="Tipo"
            name={`type-${index}`}
            className="gap-1"
            children={
              <select
                name={`type-${index}`}
                value={field.type}
                onChange={(event) => onChange({ type: event.target.value })}
                className="input"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            }
          />
          <label className="flex items-center gap-1.5 pb-2.5 text-sm">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(event) => onChange({ required: event.target.checked })}
              className="checkbox"
            />
            Obligatorio
          </label>
        </div>
      </div>
      {needsOptions && (
        <Field
          label="Opciones (una por línea)"
          name={`options-${index}`}
          className="mt-3"
          children={
            <textarea
              name={`options-${index}`}
              rows={3}
              value={field.options.join('\n')}
              onChange={(event) => onChange({ options: event.target.value.split('\n').map((line) => line.trim()) })}
              className="input min-h-11"
            />
          }
        />
      )}
      <div className="mt-3 flex justify-end">
        <Button variant="danger" size="sm" onClick={onRemove} type="button">
          Quitar campo
        </Button>
      </div>
    </li>
  )
}

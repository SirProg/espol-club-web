import { useId } from 'react'

/**
 * Renderiza un formulario dinámico a partir del `fields[]` que devuelve el API.
 *
 * Es el mismo esquema que rellena el estudiante desde la app móvil, así que en
 * el panel sirve para que el líder vea **exactamente** lo que va a recibir
 * antes de publicarlo. Construir un formulario a ciegas era la forma más fácil
 * de publicar uno con una pregunta mal redactada.
 *
 * Los siete tipos son los del catálogo cerrado de MASTER §7.3 y de
 * `apps/dynamicforms/schema.py`: text, textarea, number, date, select, radio,
 * checkbox. Cualquier otro valor se degrada a texto en lugar de romper.
 */
export default function DynamicForm({
  fields = [],
  values = {},
  onChange,
  errors = {},
  disabled = false,
}) {
  const prefix = useId()

  if (fields.length === 0) {
    return (
      <p className="t-caption rounded-[10px] bg-surface-alt px-4 py-3">
        Aún no has añadido campos: el formulario se verá vacío.
      </p>
    )
  }

  const ordered = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className="space-y-4">
      {ordered.map((field) => (
        <DynamicField
          key={field.field_id}
          field={field}
          idPrefix={prefix}
          value={values[field.field_id]}
          error={errors[field.field_id]}
          disabled={disabled}
          onChange={onChange}
        />
      ))}
    </div>
  )
}

function DynamicField({ field, idPrefix, value, error, disabled, onChange }) {
  const id = `${idPrefix}-${field.field_id}`
  const type = field.type ?? 'text'
  const options = field.options ?? []
  const set = (next) => onChange?.(field.field_id, next)

  // Las casillas admiten varias respuestas: su valor es siempre una lista.
  const checked = Array.isArray(value) ? value : []

  return (
    <fieldset className="flex flex-col gap-1" disabled={disabled}>
      <legend className="t-label">
        {field.label}
        {field.required && <span className="text-danger"> *</span>}
      </legend>

      {type === 'textarea' && (
        <textarea
          id={id}
          rows={3}
          className={`input ${error ? 'input-invalid' : ''}`}
          value={value ?? ''}
          onChange={(event) => set(event.target.value)}
        />
      )}

      {type === 'select' && (
        <select
          id={id}
          className={`input ${error ? 'input-invalid' : ''}`}
          value={value ?? ''}
          onChange={(event) => set(event.target.value)}
        >
          <option value="">Selecciona…</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      {type === 'radio' && (
        <div className="flex flex-col gap-2 pt-1">
          {options.map((option) => (
            <label key={option} className="flex min-h-11 items-center gap-2 md:min-h-0">
              <input
                type="radio"
                name={id}
                value={option}
                checked={value === option}
                onChange={() => set(option)}
                className="radio"
              />
              <span className="t-body">{option}</span>
            </label>
          ))}
        </div>
      )}

      {type === 'checkbox' && (
        <div className="flex flex-col gap-2 pt-1">
          {options.map((option) => (
            <label key={option} className="flex min-h-11 items-center gap-2 md:min-h-0">
              <input
                type="checkbox"
                value={option}
                checked={checked.includes(option)}
                onChange={(event) =>
                  set(
                    event.target.checked
                      ? [...checked, option]
                      : checked.filter((item) => item !== option),
                  )
                }
                className="checkbox"
              />
              <span className="t-body">{option}</span>
            </label>
          ))}
        </div>
      )}

      {(type === 'text' || type === 'number' || type === 'date') && (
        <input
          id={id}
          type={type}
          className={`input ${error ? 'input-invalid' : ''}`}
          value={value ?? ''}
          onChange={(event) => set(event.target.value)}
        />
      )}

      {/* Un tipo desconocido (esquema más nuevo que este cliente) cae aquí. */}
      {!['text', 'textarea', 'number', 'date', 'select', 'radio', 'checkbox'].includes(
        type,
      ) && (
        <input
          id={id}
          type="text"
          className={`input ${error ? 'input-invalid' : ''}`}
          value={value ?? ''}
          onChange={(event) => set(event.target.value)}
        />
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  )
}

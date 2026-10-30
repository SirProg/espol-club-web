import { forwardRef, useId } from 'react'

/**
 * Campo de formulario con etiqueta y error.
 *
 * Los errores del API (`ApiError.forField(name)`) se pintan bajo el input
 * exacto que los causó. Los campos heredan la voz de trabajo (Atkinson).
 */
const Field = forwardRef(function Field(
  {
    label,
    name,
    type = 'text',
    error,
    hint,
    required,
    className = '',
    inputClassName = '',
    children,
    ...props
  },
  ref,
) {
  const id = useId()
  const inputId = props.id ?? `field-${id}`
  const invalid = Boolean(error)

  // `.input` vive en styles/index.css: es el mismo control que usan los
  // <select> y <textarea> sueltos de las tablas y los modales.
  const base = 'input'
  const ring = invalid ? 'input-invalid' : ''

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="t-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {children ? (
        children
      ) : (
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${inputId}-error` : undefined}
          className={`${base} ${ring} ${inputClassName}`}
          {...props}
        />
      )}
      {hint && !invalid && <p className="t-caption">{hint}</p>}
      {invalid && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export default Field

/** Formateo de presentación. Todo en es-EC, la configuración de la ESPOL. */

const LOCALE = 'es-EC'

const dateFmt = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function parse(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 12 ago 2026 */
export function fmtDate(value) {
  const date = parse(value)
  return date ? dateFmt.format(date) : '—'
}

/** 12 ago 2026, 14:30 */
export function fmtDateTime(value) {
  const date = parse(value)
  return date ? dateTimeFmt.format(date) : '—'
}

/** Fecha en el formato que esperan los <input type="date">: YYYY-MM-DD. */
export function toDateInput(value) {
  const date = parse(value)
  if (!date) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Fecha y hora local para <input type="datetime-local">. */
export function toDateTimeInput(value) {
  const date = parse(value)
  if (!date) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** Iniciales para el avatar, máximo dos letras. */
export function initials(name) {
  if (!name) return '—'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** "3 miembros" / "1 miembro" — evita el "1 miembros" que delata una plantilla. */
export function plural(count, singular, pluralForm) {
  const n = count ?? 0
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/**
 * El API responde los errores con un sobre uniforme
 * (core/api/exception_handler.py):
 *
 *   { "error": { "code", "message", "field"?, "errors"? } }
 *
 * Los éxitos NO vienen envueltos. Aquí se normaliza el sobre a una excepción
 * con la que los formularios pueden trabajar directamente.
 */

export class ApiError extends Error {
  constructor({ status, code, message, field, errors }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    /** Campo culpable, cuando el servidor lo señala. */
    this.field = field ?? null
    /** Errores por campo: { campo: [mensajes] }. */
    this.errors = errors ?? null
  }

  /** Mensajes de un campo concreto, para pintarlos bajo su input. */
  forField(name) {
    if (this.field === name) return this.message
    const entry = this.errors?.[name]
    if (!entry) return null
    return Array.isArray(entry) ? entry.join(' ') : String(entry)
  }
}

/**
 * Mensajes canónicos de bloqueo. El servidor ya manda `message` en español;
 * esto solo cubre los códigos donde conviene una redacción más útil en el
 * contexto del panel, y los fallos de red que el servidor nunca ve.
 */
const MESSAGES = {
  network:
    'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  invalid_credentials: 'La matrícula o la contraseña no coinciden.',
  account_not_verified:
    'Tu cuenta aún no está verificada. Revisa tu correo institucional.',
  token_not_valid: 'Tu sesión expiró. Inicia sesión nuevamente.',
  permission_denied: 'Tu rol no tiene permiso para realizar esta acción.',
  not_found: 'No encontramos lo que buscabas.',
  throttled: 'Demasiados intentos. Espera un momento antes de reintentar.',
  server_error: 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.',
}

export function messageFor(code, fallback) {
  return MESSAGES[code] ?? fallback ?? 'Ocurrió un error inesperado.'
}

/** Construye un ApiError a partir de una respuesta fallida. */
export async function fromResponse(response) {
  let payload = null
  try {
    payload = await response.json()
  } catch {
    // Respuestas sin cuerpo (502, timeouts del proxy) llegan aquí.
  }

  const envelope = payload?.error ?? {}
  const code = envelope.code ?? (response.status >= 500 ? 'server_error' : 'error')

  return new ApiError({
    status: response.status,
    code,
    message: messageFor(code, envelope.message),
    field: envelope.field,
    errors: envelope.errors,
  })
}

export function networkError(cause) {
  const error = new ApiError({
    status: 0,
    code: 'network',
    message: MESSAGES.network,
  })
  error.cause = cause
  return error
}

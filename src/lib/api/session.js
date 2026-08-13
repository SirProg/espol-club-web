/**
 * Custodia de los tokens JWT.
 *
 * El API no tiene endpoint de cierre de sesión ni lista negra
 * (`ROTATE_REFRESH_TOKENS` está activo pero `BLACKLIST_AFTER_ROTATION` no):
 * cerrar sesión es, literalmente, olvidar los tokens aquí.
 *
 * El refresh **rota en cada renovación**. Si no se guarda el nuevo, la sesión
 * muere en cuanto caduca el anterior, así que `setTokens` se llama siempre con
 * ambos valores.
 */

const ACCESS_KEY = 'espolclub_access'
const REFRESH_KEY = 'espolclub_refresh'

/** El cliente avisa aquí cuando la sesión deja de ser recuperable. */
const listeners = new Set()

function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function getAccess() {
  return read(ACCESS_KEY)
}

export function getRefresh() {
  return read(REFRESH_KEY)
}

export function setTokens({ access, refresh }) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    // El servidor devuelve un refresh nuevo en cada renovación: hay que
    // reemplazar el anterior o la sesión caduca a los 7 días sin remedio.
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  } catch {
    // Modo privado sin almacenamiento: la sesión vive lo que viva la pestaña.
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    // Nada que limpiar.
  }
}

export function hasSession() {
  return Boolean(getRefresh())
}

/** Se dispara cuando el refresh falla: AuthContext lo usa para cerrar sesión. */
export function onSessionLost(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifySessionLost() {
  clearTokens()
  listeners.forEach((listener) => listener())
}

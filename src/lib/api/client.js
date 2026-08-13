/**
 * Cliente HTTP contra el API de ESPOLCLUB (Django REST, base /api/v1/).
 *
 * Este es el único punto de acceso a datos del panel, igual que `data-service.js`
 * lo fue en la Fase 1 (MASTER §15.1): las pantallas no hacen fetch por su cuenta.
 *
 * Dos comportamientos del servidor que gobiernan el diseño de este archivo:
 *
 *  1. El access token dura 30 minutos y el refresh **rota** en cada renovación.
 *     Ante un 401 se renueva una sola vez y se reintenta la petición; las
 *     peticiones concurrentes esperan a la misma renovación (single-flight) en
 *     vez de disparar una cada una.
 *
 *  2. Ningún endpoint del API usa vistas genéricas, así que la paginación y los
 *     filtros de DRF son configuración muerta: las listas llegan como arrays
 *     planos, completos y sin envolver. Filtrar, ordenar y paginar es trabajo
 *     del cliente.
 */

import { fromResponse, networkError } from './errors'
import {
  clearTokens,
  getAccess,
  getRefresh,
  notifySessionLost,
  setTokens,
} from './session'

const BASE = (
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api/v1'
).replace(/\/+$/, '')

/** Renovación en curso, compartida por todas las peticiones que topen un 401. */
let refreshing = null

function buildUrl(path, params) {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    // Omitimos vacíos: el API interpreta `?status=` como filtro por cadena vacía.
    if (value === undefined || value === null || value === '') return
    url.searchParams.set(key, String(value))
  })
  return url.toString()
}

async function parseBody(response) {
  if (response.status === 204) return null
  const type = response.headers.get('content-type') ?? ''
  if (!type.includes('application/json')) return response.text()
  try {
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Renueva el access token. Devuelve `true` si la sesión sigue viva.
 * El `refresh` nuevo se persiste siempre: el servidor rota el token.
 */
function refreshSession() {
  if (refreshing) return refreshing

  const refresh = getRefresh()
  if (!refresh) return Promise.resolve(false)

  refreshing = (async () => {
    try {
      const response = await fetch(buildUrl('/auth/refresh/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!response.ok) {
        notifySessionLost()
        return false
      }
      const data = await response.json()
      setTokens({ access: data.access, refresh: data.refresh })
      return true
    } catch {
      // Un fallo de red no invalida la sesión: puede volver la conexión.
      clearTokens()
      return false
    } finally {
      refreshing = null
    }
  })()

  return refreshing
}

async function send(path, { method, params, body, multipart, auth, signal }) {
  const headers = {}
  if (auth) {
    const access = getAccess()
    if (access) headers.Authorization = `Bearer ${access}`
  }

  let payload
  if (multipart) {
    // FormData fija su propio Content-Type con el boundary: no tocarlo.
    payload = multipart
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  try {
    return await fetch(buildUrl(path, params), {
      method,
      headers,
      body: payload,
      signal,
      // El API autentica por Bearer; no usamos cookies de sesión.
      credentials: 'omit',
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw networkError(error)
  }
}

/**
 * Petición al API.
 *
 * @param {string} path      Ruta relativa a /api/v1, con barra final.
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {object} [options.params]     Query string; los vacíos se descartan.
 * @param {object} [options.body]       Cuerpo JSON.
 * @param {FormData} [options.multipart] Cuerpo multipart (cargas de PDF).
 * @param {boolean} [options.auth=true] Adjuntar el Bearer.
 * @param {boolean} [options.blob=false] Devolver el binario (exportaciones).
 */
export async function request(path, options = {}) {
  const config = { method: 'GET', auth: true, ...options }

  let response = await send(path, config)

  // 401 con sesión: renovar una vez y reintentar. Si la renovación falla,
  // notifySessionLost ya cerró la sesión y el error sube tal cual.
  if (response.status === 401 && config.auth && getRefresh()) {
    const renewed = await refreshSession()
    if (renewed) response = await send(path, config)
  }

  if (!response.ok) throw await fromResponse(response)

  if (config.blob) {
    return {
      blob: await response.blob(),
      filename: filenameFrom(response.headers.get('content-disposition')),
    }
  }

  return parseBody(response)
}

/** Extrae el nombre de archivo de un Content-Disposition. */
function filenameFrom(header) {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Descarga un archivo generado por el API (exportaciones .xlsx / .pdf de GBP).
 * El navegador bloquearía una descarga iniciada sin gesto del usuario, así que
 * esto siempre se llama desde un onClick.
 */
export async function download(path, { params, fallbackName } = {}) {
  const { blob, filename } = await request(path, { params, blob: true })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename ?? fallbackName ?? 'espolclub'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const api = {
  get: (path, params, options) => request(path, { ...options, params }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
  upload: (path, formData, options) =>
    request(path, { ...options, method: 'POST', multipart: formData }),
  download,
}

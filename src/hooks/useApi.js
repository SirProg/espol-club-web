/**
 * Recuperación de datos de pantalla: loading / error / vacío.
 *
 * Los endpoints del API devuelven arrays planos sin envolver (no hay
 * paginación real), así que aquí el "vacío" se resuelve con un array de cero
 * filas. Nada se filtra ni se pagina en el servidor.
 *
 * El `fetcher` debe ser estable (useCallback) para controlar cuándo recarga:
 * el efecto depende de su identidad. El estado de carga solo se marca en la
 * primera pasada y al pedir `reload()` a mano; una recarga por cambio de
 * fetcher conserva lo que había para no parpadear.
 */

import { useCallback, useEffect, useState } from 'react'

/**
 * @param {function} fetcher   Devuelve una promesa con el payload. Estable.
 * @param {object} options
 * @param {boolean} [options.reloadOnFocus=false] Refresca al recuperar foco.
 */
export function useApi(fetcher, options = {}) {
  const { reloadOnFocus = false } = options
  const [data, setData] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // El efecto lanza la carga; los setState ocurren tras el await, no de forma
  // síncrona dentro del cuerpo del efecto.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const result = await fetcher()
        if (!cancelled) {
          setData(result)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
          setData(undefined)
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [fetcher])

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetcher()
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [fetcher])

  useEffect(() => {
    if (!reloadOnFocus) return undefined
    const onFocus = () => {
      if (!document.hidden) reload()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [reload, reloadOnFocus])

  const empty = !loading && !error && Array.isArray(data) && data.length === 0

  return { data, loading, error, empty, reload }
}

/**
 * Sesión del usuario autenticado.
 *
 * Mantiene la sesión de `/auth/me/` (rol **derivado** en el servidor, club
 * liderado y permisos por club). El guarda de cliente es presentación: el API
 * es quien autoriza de verdad. Cuando el refresh deja de servir, el cliente
 * notifica y aquí se cierra la sesión.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import { auth } from '../lib/api/endpoints'
import { clearTokens, getAccess, hasSession, onSessionLost, setTokens } from '../lib/api/session'
import { AuthContext } from './auth'

function readSession() {
  try {
    const raw = localStorage.getItem('espolclub_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const [booting, setBooting] = useState(() => hasSession() && !readSession())

  // Refresca la sesión cada vez que la página recupera el foco: es el punto
  // donde más barato sale detectar una revocación de liderazgo.
  const refresh = useCallback(async () => {
    if (!getAccess()) return
    try {
      const data = await auth.me()
      setSession(data)
      try {
        localStorage.setItem('espolclub_session', JSON.stringify(data))
      } catch {
        // Sin almacenamiento la sesión vive lo que viva la pestaña.
      }
      return data
    } catch {
      return null
    } finally {
      setBooting(false)
    }
  }, [])

  // Refresca la sesión al cargar si hay tokens pero no sesión cacheada
  // (pestaña recargada en frío). Con un `.finally` en promesa no se llama
  // setState de forma síncrona dentro del efecto.
  useEffect(() => {
    if (!booting) return undefined
    let cancelled = false
    const restore = async () => {
      try {
        const data = await auth.me()
        if (cancelled) return
        setSession(data)
        try {
          localStorage.setItem('espolclub_session', JSON.stringify(data))
        } catch {
          // Sin almacenamiento la sesión vive lo que viva la pestaña.
        }
      } catch {
        // La sesión cacheada ya no vale; se limpia con onSessionLost o en el
        // siguiente intento. Lo importante es salir del estado booting.
      } finally {
        if (!cancelled) setBooting(false)
      }
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [booting])

  // El cliente dispara onSessionLost cuando el refresh falla: aquí cerramos.
  useEffect(
    () =>
      onSessionLost(() => {
        setSession(null)
        try {
          localStorage.removeItem('espolclub_session')
        } catch {
          // Nada que limpiar.
        }
      }),
    [],
  )

  useEffect(() => {
    const onFocus = () => {
      if (getAccess()) refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const login = useCallback(async (identifier, password) => {
    const tokens = await auth.login(identifier, password)
    // El cliente no persiste por sí solo: aquí se fijan los tokens (login() solo
    // devuelve la pareja; quién los guarda es el contexto de sesión).
    setTokens(tokens)
    const data = await auth.me()
    setSession(data)
    try {
      localStorage.setItem('espolclub_session', JSON.stringify(data))
    } catch {
      // Sin almacenamiento la sesión vive lo que viva la pestaña.
    }
    return data
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setSession(null)
    try {
      localStorage.removeItem('espolclub_session')
    } catch {
      // Nada que limpiar.
    }
  }, [])

  const can = useCallback(
    (permission, clubId) => {
      const memberships = session?.memberships ?? []
      const target = clubId ?? session?.led_club_id
      const membership = memberships.find((m) => m.club_id === target)
      if (!membership) return false
      // Club en 'Pending Leader' ⇒ has_club_permission devuelve False para todo.
      if (membership.club_status !== 'Active') return false
      if (!permission) return true
      return (membership.permissions ?? []).includes(permission)
    },
    [session],
  )

  const value = useMemo(
    () => ({
      session,
      appRole: session?.app_role ?? null,
      profile: session?.profile ?? null,
      ledClubId: session?.led_club_id ?? null,
      isGbp: session?.is_gbp_admin ?? false,
      booting,
      can,
      login,
      logout,
      refresh,
    }),
    [session, booting, can, login, logout, refresh],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

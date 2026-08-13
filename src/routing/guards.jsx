import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../context/auth'
import { ROUTES, homeFor } from '../routing/modules'

function BootingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-ink">
      <p className="font-display text-lg font-bold tracking-tight">ESPOLCLUB</p>
      <p className="t-caption">Cargando sesión…</p>
    </div>
  )
}

/**
 * Guarda de sesión: sin token válido → /login (sin perder el destino).
 * Mientras se refresca `/auth/me/` al cargar la página, muestra el booting.
 */
export function RequireAuth({ children }) {
  const { session, booting } = useAuth()
  const location = useLocation()

  if (booting) return <BootingScreen />
  if (!session) return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />

  return children
}

/**
 * Guarda de rol: quien aterriza en un panel ajeno se redirige al hogar de su
 * propio rol (y el API, en el fondo, sigue siendo quien deniega la autorización
 * de verdad).
 *
 * El destino sale de `homeFor`, la misma tabla que usan el enrutador y el
 * login. Mantener una segunda copia aquí fue lo que abrió el rebote infinito
 * del Estudiante entre "/" y "/login".
 */
export function RequireRole({ role, children }) {
  const { appRole } = useAuth()
  if (appRole === role) return children
  return <Navigate to={homeFor(appRole)} replace />
}

/** Vista para sesiones autenticadas que visitan /login. */
export function PublicOnly({ children }) {
  const { session, booting } = useAuth()
  if (booting) return <BootingScreen />
  if (session) return <Navigate to={homeFor(session.app_role)} replace />
  return children
}

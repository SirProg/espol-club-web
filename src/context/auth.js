import { createContext, useContext } from 'react'

/**
 * Contexto y hook de sesión. Separado del proveedor por la regla
 * react-refresh/only-export-components (Fast Refresh).
 */
export const AuthContext = createContext(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth requiere estar dentro de <AuthProvider>')
  return value
}

import { createContext, useContext } from 'react'

/**
 * Contexto y hook de avisos. Separado del proveedor por la regla
 * react-refresh/only-export-components (Fast Refresh).
 */
export const ToastContext = createContext(null)

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast requiere estar dentro de <ToastProvider>')
  return value
}

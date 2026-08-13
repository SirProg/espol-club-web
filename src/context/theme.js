import { createContext, useContext } from 'react'

/**
 * Contexto y hook del tema. Separado del proveedor para que el conmutador
 * (ThemeSwitch) y las pantallas no compartan archivo con un componente: la
 * regla react-refresh/only-export-components lo exige para Fast Refresh.
 */

export const THEME_MODES = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

export const ThemeContext = createContext(null)

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme requiere estar dentro de <ThemeProvider>')
  return value
}

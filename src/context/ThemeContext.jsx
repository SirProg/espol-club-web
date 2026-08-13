/**
 * Tema claro / oscuro / sistema.
 *
 * Tres modos, los mismos que la app móvil y con la misma clave de
 * almacenamiento (`theme_mode`), para que ambos entornos se sientan uno solo.
 *
 * La PREFERENCIA (system|light|dark) vive en localStorage; el tema RESUELTO
 * (light|dark) vive en <html data-theme>, donde lo dejó el script anti-FOUC de
 * index.html. Separarlos es lo que permite seguir al sistema en vivo sin que el
 * CSS tenga que consultar dos fuentes.
 */

import { useCallback, useEffect, useState } from 'react'

import { ThemeContext, THEME_MODES } from './theme'

const STORAGE_KEY = 'theme_mode'
const QUERY = '(prefers-color-scheme: dark)'

function readMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return THEME_MODES.some((m) => m.value === stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function resolve(mode) {
  if (mode === 'system') {
    return window.matchMedia(QUERY).matches ? 'dark' : 'light'
  }
  return mode
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readMode)
  const [scheme, setScheme] = useState(() => resolve(readMode()))

  // Aplica el tema resuelto y, si el modo es "sistema", sigue escuchando:
  // cambiar el tema del SO debe repintar sin recargar.
  useEffect(() => {
    const media = window.matchMedia(QUERY)

    const apply = () => {
      const next = resolve(mode)
      setScheme(next)
      document.documentElement.dataset.theme = next
    }

    apply()

    if (mode !== 'system') return undefined
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [mode])

  const changeMode = useCallback((next) => {
    setMode(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento la preferencia dura lo que dure la pestaña.
    }
  }, [])

  return (
    <ThemeContext value={{ mode, scheme, isDark: scheme === 'dark', setMode: changeMode }}>
      {children}
    </ThemeContext>
  )
}

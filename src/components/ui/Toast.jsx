import { useCallback, useMemo, useRef, useState } from 'react'

import { ToastContext } from './toast-context'

/**
 * Avisos transitorios. Plano: esquina inferior derecha, sin animaciones
 * avanzadas (RNF-07), sin autodescarte por defecto en pantallas pequeñas.
 */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const push = useCallback((message, tone = 'neutral') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4500)
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      toast: push,
      dismiss,
    }),
    [push, dismiss],
  )

  // Fondo tenue + tinta saturada + anillo, como los badges: el relleno sólido
  // con texto blanco pierde contraste en el tema oscuro, donde los colores de
  // estado suben de luminosidad.
  const toneBg = {
    success: 'bg-success-soft text-success ring-success/30',
    danger: 'bg-danger-soft text-danger ring-danger/30',
    warning: 'bg-warning-soft text-warning ring-warning/30',
    neutral: 'bg-primary-soft text-primary-strong ring-primary/30',
  }

  return (
    <ToastContext value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-raised ring-1 ${toneBg[toast.tone] ?? toneBg.neutral}`}
          >
            <p className="leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Cerrar aviso"
              className="opacity-70 hover:opacity-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}

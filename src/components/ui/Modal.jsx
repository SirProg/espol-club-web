import { useEffect, useId, useRef } from 'react'

/** Todo lo que puede recibir foco dentro del diálogo. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo modal accesible.
 *
 * Cierra con Escape, bloquea el scroll del body y **atrapa el foco**: al abrir
 * lo lleva al primer control, el tabulador circula dentro del diálogo y al
 * cerrar lo devuelve al elemento que lo abrió. Catorce de las dieciocho
 * pantallas del panel operan por modales, así que dejar el foco suelto detrás
 * del velo dejaba el teclado navegando una página que no se ve.
 */
export default function Modal({ open, onClose, title, description, children, footer, wide }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined

    const opener = document.activeElement
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // El diálogo se acaba de montar: enfoca el primer control, o el contenedor
    // si el modal es puramente informativo.
    const node = dialogRef.current
    const first = node?.querySelector(FOCUSABLE)
    ;(first ?? node)?.focus()

    const onKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
        return
      }
      if (event.key !== 'Tab' || !node) return

      const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const edge = event.shiftKey ? items[0] : items[items.length - 1]
      if (document.activeElement === edge || !node.contains(document.activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? items[items.length - 1] : items[0]).focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
      // Devolver el foco a quien abrió: sin esto se cae al <body> y el
      // tabulador reinicia desde la cabecera de la página.
      if (opener instanceof HTMLElement) opener.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primary-strong/50 p-0 dark:bg-black/60 md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-surface shadow-raised md:rounded-xl ${wide ? 'md:max-w-2xl' : 'md:max-w-lg'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="t-heading">
              {title}
            </h2>
            {description && <p className="t-caption mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted ring-1 ring-border hover:bg-surface-alt hover:text-ink"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

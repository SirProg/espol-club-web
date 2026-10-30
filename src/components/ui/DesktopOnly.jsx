import { useIsMobile } from '../../hooks/useIsDesktop'

/**
 * Matriz de §4 del plan: la gestión pesada se difiere al escritorio.
 *
 * Bajo 768px este componente sustituye el control por un aviso discreto —
 * "Disponible en escritorio" — nunca un botón muerto. Es presentación; quien
 * autoriza de verdad es el API.
 */
export default function DesktopOnly({ children }) {
  const isMobile = useIsMobile()
  if (!isMobile) return children

  return (
    <div className="rounded-lg bg-primary-soft px-4 py-3">
      <p className="t-caption text-primary">
        Disponible en escritorio. Esta gestión requiere una pantalla más amplia.
      </p>
    </div>
  )
}

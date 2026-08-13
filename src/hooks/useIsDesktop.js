/**
 * Puntos de corte del panel.
 *
 * MASTER §8 fija la política (RF-53 formularios, miembros y roles solo desde la
 * web; RF-54 GBP solo desde la web; RF-57 el líder puede aprobar solicitudes
 * desde el móvil) pero nunca describe qué pasa a 375 px. La regla del panel:
 *
 *   móvil  <768   → se consulta todo; la gestión pesada se difiere
 *   tablet 768–1023 → se comporta como escritorio, con tablas condensadas
 *   escritorio ≥1024
 *
 * Es una regla de presentación. Quien autoriza de verdad es el API.
 */

import { useEffect, useState } from 'react'

const MOBILE_MAX = 767

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

/** `true` bajo 768 px: la gestión pesada se difiere al escritorio. */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_MAX}px)`)
}

/** `true` desde 768 px: el panel opera con todas sus acciones. */
export function useIsDesktop() {
  return !useIsMobile()
}

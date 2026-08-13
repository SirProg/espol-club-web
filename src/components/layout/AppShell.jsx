import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { LIDER_MODULES, GBP_MODULES } from '../../routing/modules'
import { useAuth } from '../../context/auth'

/**
 * Cáscara de cada panel. El rol (derivado en el servidor) decide qué lista de
 * módulos se muestra: Líder o GBP.
 */
export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isGbp } = useAuth()
  const modules = isGbp ? GBP_MODULES : LIDER_MODULES

  // useLocation y no window.location: leer del objeto global no suscribe al
  // componente a los cambios de ruta, así que el título se quedaba congelado
  // en el del primer render.
  const { pathname } = useLocation()

  // De la ruta más específica a la más general: el Panel del Líder vive en
  // "/lider", del que cuelgan todas las demás, y ganaría siempre con startsWith.
  const byLength = [...modules].sort((a, b) => b.path.length - a.path.length)

  const exact = byLength.find((module) =>
    module.end ? pathname === module.path : pathname.startsWith(module.path),
  )

  // Las pantallas de detalle (p. ej. /gbp/club/62) no tienen entrada propia en
  // el menú: heredan el nombre de la sección de la que cuelgan, en vez de caer
  // en una etiqueta genérica que no dice dónde está uno.
  const parent = exact ?? byLength.find((module) => pathname.startsWith(module.path))

  const title = parent?.label

  return (
    <div className="min-h-screen bg-background text-ink">
      <Sidebar modules={modules} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <TopBar title={title ?? 'Panel'} onMenu={() => setMenuOpen(true)} />
        {children}
      </div>
    </div>
  )
}

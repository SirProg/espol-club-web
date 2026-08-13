import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import Sidebar from '../../components/layout/Sidebar'
import TopBar from '../../components/layout/TopBar'
import TabBar from '../../components/layout/TabBar'
import { estudianteModules } from '../../routing/modules'
import { useAuth } from '../../context/auth'

/**
 * Cáscara del entorno del Estudiante y del Miembro (MASTER §10 B).
 *
 * Un solo código para las dos versiones que pide el encargo: barra lateral en
 * escritorio y pestañas inferiores en el teléfono. No hay pantallas distintas
 * por dispositivo, solo una distribución que se adapta — aquí no aplica la
 * restricción de RF-53/RF-54, que es del panel de gestión: todo lo que hace un
 * estudiante son decisiones sueltas que funcionan igual de bien en un móvil.
 */
export default function EstudianteShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { appRole } = useAuth()
  const { pathname } = useLocation()

  const modules = estudianteModules(appRole)

  const byLength = [...modules].sort((a, b) => b.path.length - a.path.length)
  const exact = byLength.find((module) =>
    module.end ? pathname === module.path : pathname.startsWith(module.path),
  )
  const title = (exact ?? byLength.find((m) => pathname.startsWith(m.path)))?.label

  return (
    <div className="min-h-screen bg-background text-ink">
      <Sidebar
        modules={modules}
        subtitle="Mi espacio"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="lg:pl-64">
        <TopBar title={title ?? 'Mi espacio'} onMenu={() => setMenuOpen(true)} />
        {/* El relleno inferior deja sitio a las pestañas, que van fijas. */}
        <main className="px-4 py-6 pb-28 md:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <TabBar modules={modules} />
    </div>
  )
}

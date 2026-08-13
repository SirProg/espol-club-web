import { NavLink } from 'react-router-dom'

/**
 * Pestañas inferiores del entorno del estudiante, bajo 1024px.
 *
 * En escritorio manda la barra lateral; en el teléfono, la navegación vive
 * donde llega el pulgar. Es la misma estructura que la app Expo, para que
 * cambiar de dispositivo no obligue a reaprender dónde está cada cosa.
 */

const ICONS = {
  inicio: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
  clubes: <path d="M17 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0M22 20v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />,
  eventos: <path d="M3 9h18M7 3v3M17 3v3M4.5 5h15a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19.5 21h-15A1.5 1.5 0 0 1 3 19.5v-13A1.5 1.5 0 0 1 4.5 5" />,
  credencial: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />,
  perfil: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" />,
}

export default function TabBar({ modules }) {
  const tabs = modules.filter((module) => module.tab)

  return (
    <nav
      aria-label="Navegación principal"
      // pb con safe-area: en iPhone la barra de gestos se come el borde inferior.
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {tabs.map((module) => (
          <li key={module.path} className="flex-1">
            <NavLink
              to={module.path}
              end={module.end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-ink-faint'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isActive ? 2.2 : 1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {ICONS[module.tab]}
                  </svg>
                  <span className="truncate">{module.tabLabel ?? module.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

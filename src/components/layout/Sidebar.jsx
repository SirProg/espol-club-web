import { NavLink } from 'react-router-dom'

import Pennant from '../ui/Pennant'
import { useAuth } from '../../context/auth'
import { ROLE_LABELS } from '../../routing/modules'

/**
 * Barra lateral fija en escritorio; drawer deslizante bajo 768px.
 * Wordmark con el banderín (único uso del serif en la marca).
 */
export default function Sidebar({ modules, open, onClose, subtitle = 'Panel de gestión' }) {
  const { session, logout } = useAuth()

  const sections = []
  for (const module of modules) {
    let section = sections.find((item) => item.title === module.section)
    if (!section) {
      section = { title: module.section, items: [] }
      sections.push(section)
    }
    section.items.push(module)
  }

  const content = (
    <div className="flex h-full flex-col bg-hero-bg text-hero-text">
      <div className="flex items-center gap-3 px-5 py-6">
        {/* La barra ya es azul institucional: el banderín va en la tinta de la
            cabecera, o se pierde sobre su propio fondo. */}
        <Pennant
          text="E"
          width={34}
          color="var(--espol-hero-text)"
          ink="var(--espol-hero-bg)"
        />
        <div>
          <p className="font-display text-lg font-bold leading-none">ESPOLCLUB</p>
          <p className="mt-1 text-[11px] uppercase tracking-[1.1px] text-hero-muted">
            {subtitle}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Menú principal">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="t-label mb-1 px-2 !text-hero-muted">{section.title}</p>
            <ul>
              {section.items.map((module) => (
                <li key={module.path}>
                  <NavLink
                    to={module.path}
                    end={module.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                        isActive ? 'bg-hero-line text-hero-text' : 'text-hero-muted hover:bg-hero-line/60 hover:text-hero-text'
                      }`
                    }
                  >
                    {module.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-hero-line px-5 py-4">
        <p className="t-caption text-hero-muted">Sesión</p>
        <p className="mt-0.5 truncate text-sm font-semibold">
          {session?.profile?.full_name ?? '—'}
        </p>
        <p className="text-xs text-hero-muted">{ROLE_LABELS[session?.app_role] ?? session?.app_role}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full rounded-md bg-hero-line/40 px-3 py-2 text-left text-xs font-semibold text-hero-text transition-colors hover:bg-hero-line/70"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-card">{content}</div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-2 text-white"
            aria-label="Cerrar menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}

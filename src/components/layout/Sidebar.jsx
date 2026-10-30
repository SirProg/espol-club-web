import { NavLink } from 'react-router-dom'

import BrandMark from '../ui/BrandMark'
import InstallButton from '../ui/InstallButton'
import { useAuth } from '../../context/auth'
import { ROLE_LABELS } from '../../routing/modules'

/**
 * Barra lateral fija en escritorio; drawer deslizante bajo 768px.
 * Pared clara y pasos en píldora, como la navegación de Club-search.
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
    <div className="flex h-full flex-col border-r border-border bg-background text-ink">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <BrandMark height={26} />
        <div>
          <p className="font-display text-lg font-extrabold leading-none tracking-tight">ESPOLCLUB</p>
          <p className="t-caption mt-1 !text-[13px] !leading-4">
            {subtitle}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Menú principal">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="t-label mb-1 px-3">{section.title}</p>
            <ul>
              {section.items.map((module) => (
                <li key={module.path}>
                  <NavLink
                    to={module.path}
                    end={module.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `block rounded-full px-3 py-2 text-[15px] font-semibold transition-colors ${
                        isActive ? 'bg-primary text-on-primary' : 'text-ink hover:bg-primary/8'
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

      <div className="border-t border-border px-5 py-4">
        <p className="t-caption">Sesión</p>
        <p className="mt-0.5 truncate text-sm font-semibold">
          {session?.profile?.full_name ?? '—'}
        </p>
        <p className="t-caption">{ROLE_LABELS[session?.app_role] ?? session?.app_role}</p>
        <div className="mt-3 space-y-2">
          <InstallButton variant="lateral" />
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-full px-3 py-2 text-[13px] font-semibold text-ink ring-1 ring-hairline transition-colors hover:bg-primary/7"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-primary-strong/50 dark:bg-black/60" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-raised">{content}</div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-white"
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

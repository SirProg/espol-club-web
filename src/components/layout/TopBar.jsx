import { useAuth } from '../../context/auth'
import { ROLE_LABELS } from '../../routing/modules'
import ThemeSwitch from '../ui/ThemeSwitch'
import NotificationBell from './NotificationBell'

/**
 * Barra superior: hamburguesa en móvil, nombre del módulo, y a la derecha el
 * conmutador de tema, la campana y la sesión (rol + salida).
 */
export default function TopBar({ title, onMenu }) {
  const { appRole, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="rounded-md p-2 text-ink-muted hover:bg-surface-alt lg:hidden"
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="truncate t-heading">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitch compact />
          <NotificationBell />
          <div className="hidden items-center gap-3 border-l border-border pl-3 sm:flex">
            <p className="t-caption !m-0">{ROLE_LABELS[appRole] ?? appRole}</p>
            <button
              type="button"
              onClick={logout}
              className="rounded-md px-2 py-1 text-xs font-semibold text-danger hover:bg-danger-soft"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

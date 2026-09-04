import { Link } from 'react-router-dom'

import Pennant from '../../components/ui/Pennant'
import ThemeSwitch from '../../components/ui/ThemeSwitch'
import InstallButton from '../../components/ui/InstallButton'
import { ROUTES } from '../../routing/modules'

/**
 * Marco de las pantallas de autenticación: marca arriba, panel de la
 * institución (identidad: quién publica) y la tarjeta del formulario.
 */
export default function AuthLayout({ title, eyebrow, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <Link to={ROUTES.LOGIN} className="flex items-center gap-3" aria-label="ESPOLCLUB — inicio de sesión">
          <Pennant text="E" width={28} />
          <span className="font-display text-lg font-bold tracking-tight">ESPOLCLUB</span>
        </Link>
        {/* Instalable también antes de iniciar sesión: es la primera
            pantalla que ve cualquiera y el mejor momento para ofrecerlo. */}
        <div className="flex items-center gap-2">
          <InstallButton />
          <ThemeSwitch compact />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-6 md:py-10">
        <div className="w-full max-w-md">
          {eyebrow && (
            <div className="mb-2 flex items-center gap-2">
              <span aria-hidden="true" className="h-[3px] w-3.5 bg-accent" />
              <span className="t-label">{eyebrow}</span>
            </div>
          )}
          <h1 className="t-title">{title}</h1>
          {children}
        </div>
      </main>

      <footer className="px-5 py-4">
        <p className="t-caption text-center">
          Escuela Superior Politécnica del Litoral — Clubes y capítulos estudiantiles
        </p>
      </footer>
    </div>
  )
}

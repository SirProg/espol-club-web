import { Link } from 'react-router-dom'

import BrandMark from '../../components/ui/BrandMark'
import ClubOrbit from '../../components/ui/ClubOrbit'
import ThemeSwitch from '../../components/ui/ThemeSwitch'
import InstallButton from '../../components/ui/InstallButton'
import { ROUTES } from '../../routing/modules'

/**
 * Marco de las pantallas de autenticación: la portada de Club-search, con el
 * formulario en la columna del texto (2/5) y la órbita de clubes en el resto.
 */
export default function AuthLayout({ title, eyebrow, children }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background text-ink">
      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <Link to={ROUTES.LOGIN} className="flex items-center gap-3" aria-label="ESPOLCLUB — inicio de sesión">
          <BrandMark height={28} />
          <span className="font-display text-lg font-extrabold tracking-tight">ESPOLCLUB</span>
        </Link>
        {/* Instalable también antes de iniciar sesión: es la primera
            pantalla que ve cualquiera y el mejor momento para ofrecerlo. */}
        <div className="flex items-center gap-2">
          <InstallButton />
          <ThemeSwitch compact />
        </div>
      </header>

      <main className="grid flex-1 min-[880px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="relative z-[2] order-last flex items-center justify-center px-4 py-6 min-[880px]:order-none min-[880px]:justify-end min-[880px]:pl-8 min-[880px]:pr-4">
          <div className="w-full max-w-[26rem]">
            {eyebrow && <p className="t-label mb-3">{eyebrow}</p>}
            <h1 className="t-display">{title}</h1>
            {children}
          </div>
        </div>
        <ClubOrbit />
      </main>

      <footer className="px-5 py-4">
        <p className="t-caption text-center">
          Escuela Superior Politécnica del Litoral — Clubes y capítulos estudiantiles
        </p>
      </footer>
    </div>
  )
}

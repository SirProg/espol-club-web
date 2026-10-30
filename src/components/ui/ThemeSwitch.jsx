import { useTheme, THEME_MODES } from '../../context/theme'

/** Monitor, sol y luna: los tres modos, sin texto. */
function ThemeIcon({ mode }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (mode === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    )
  }

  if (mode === 'dark') {
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

/**
 * Conmutador de tema de tres modos (system | light | dark), igual que la app
 * móvil y con la misma clave en localStorage.
 */
export default function ThemeSwitch({ compact }) {
  const { mode, setMode } = useTheme()

  // Versión de la barra superior: mismo control segmentado, reducido a iconos.
  // Un <select> nativo aquí rompía la voz del panel, y además escondía el modo
  // activo tras un desplegable en el único sitio donde conviene verlo de golpe.
  if (compact) {
    return (
      <div
        className="flex items-center gap-0.5 rounded-full bg-primary/6 p-1"
        role="group"
        aria-label="Tema"
      >
        {THEME_MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={mode === option.value}
            title={option.label}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              mode === option.value
                ? 'bg-primary text-on-primary'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span className="sr-only">{option.label}</span>
            <ThemeIcon mode={option.value} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center rounded-full bg-primary/6 p-1" role="group" aria-label="Tema">
      {THEME_MODES.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setMode(option.value)}
          aria-pressed={mode === option.value}
          className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
            mode === option.value ? 'bg-primary text-on-primary' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

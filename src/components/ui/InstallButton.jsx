import { useState } from 'react'

import { usePwaInstall } from '../../hooks/usePwaInstall'
import Modal from './Modal'
import Button from './Button'

/**
 * Botón «Instalar app», en la cabecera y en el menú lateral.
 *
 * Se ve **desde que carga la página**. Chrome solo ofrece su diálogo de
 * instalación tras medio minuto de uso, y esconder el botón hasta entonces lo
 * dejaba invisible justo cuando alguien decide si se queda. Si el diálogo aún
 * no está disponible, el botón explica el gesto de ese navegador; cuando el
 * diálogo llega, el mismo botón pasa a instalar de un toque sin que se note.
 *
 * Solo desaparece si la aplicación ya está instalada, que es cuando de verdad
 * no pinta nada.
 *
 * `variant`:
 *  · 'barra'   — compacto, para la cabecera.
 *  · 'lateral' — ancho completo, para el pie del menú.
 */

/** El gesto concreto de cada navegador cuando no hay diálogo nativo. */
const PASOS = {
  ios: {
    titulo: 'Instalar en iPhone o iPad',
    intro: 'Safari instala desde su propio menú, en dos toques.',
    pasos: [
      'Toca Compartir en la barra de Safari — el cuadrado con la flecha hacia arriba.',
      'Baja y elige «Añadir a pantalla de inicio».',
    ],
  },
  android: {
    titulo: 'Instalar en Android',
    intro: 'Desde el menú del navegador, en dos toques.',
    pasos: [
      'Abre el menú ⋮ arriba a la derecha.',
      'Elige «Instalar aplicación» o «Añadir a pantalla de inicio».',
    ],
  },
  chrome: {
    titulo: 'Instalar en Chrome',
    intro: 'Chrome ofrece la instalación desde la barra de direcciones.',
    pasos: [
      'Busca el icono de instalar (una pantalla con una flecha) al final de la barra de direcciones.',
      'Si no aparece: menú ⋮ → Enviar, guardar y compartir → Instalar página como aplicación.',
    ],
  },
  edge: {
    titulo: 'Instalar en Edge',
    intro: 'Edge ofrece la instalación desde su menú.',
    pasos: [
      'Busca el icono de instalar al final de la barra de direcciones.',
      'Si no aparece: menú ··· → Aplicaciones → Instalar este sitio como una aplicación.',
    ],
  },
  firefox: {
    titulo: 'Firefox no instala aplicaciones web',
    intro: 'En el escritorio, Firefox no permite instalar sitios como aplicaciones.',
    pasos: [
      'Abre ESPOLCLUB en Chrome o Edge para instalarla.',
      'En Firefox para Android sí puedes: menú ⋮ → «Instalar».',
    ],
  },
  otro: {
    titulo: 'Instalar ESPOLCLUB',
    intro: 'Tu navegador guarda el sitio desde su propio menú.',
    pasos: [
      'Abre el menú del navegador.',
      'Busca «Instalar», «Añadir a pantalla de inicio» o «Añadir al escritorio».',
    ],
  },
}

export default function InstallButton({ variant = 'barra' }) {
  const { modo, instalando, instalar, plataforma } = usePwaInstall()
  const [ayuda, setAyuda] = useState(false)

  if (modo === 'oculto') return null

  const guia = PASOS[plataforma] ?? PASOS.otro
  const alPulsar = () => (modo === 'instalable' ? instalar() : setAyuda(true))

  return (
    <>
      <button
        type="button"
        onClick={alPulsar}
        disabled={instalando}
        title="Instalar ESPOLCLUB en este dispositivo"
        className={
          variant === 'lateral'
            ? 'flex w-full items-center justify-center gap-2 rounded-md bg-hero-line/40 px-3 py-2 text-xs font-semibold text-hero-text transition-colors hover:bg-hero-line/70 disabled:opacity-60'
            : 'inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-primary ring-1 ring-border transition-colors hover:bg-primary-soft disabled:opacity-60'
        }
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
        </svg>
        <span className={variant === 'barra' ? 'hidden sm:inline' : undefined}>
          {instalando ? 'Instalando…' : 'Instalar app'}
        </span>
      </button>

      <Modal
        open={ayuda}
        onClose={() => setAyuda(false)}
        title={guia.titulo}
        description={guia.intro}
        footer={
          <Button variant="secondary" onClick={() => setAyuda(false)}>
            Entendido
          </Button>
        }
      >
        <ol className="space-y-3">
          {guia.pasos.map((paso, i) => (
            <li key={paso} className="flex gap-3">
              <span className="t-data shrink-0">{i + 1}</span>
              <p className="t-body">{paso}</p>
            </li>
          ))}
        </ol>
        <p className="t-caption mt-4 rounded-[10px] bg-surface-alt px-3 py-2">
          ESPOLCLUB quedará como una app más, con su icono y sin la barra del
          navegador. Funciona sin conexión para lo que ya hayas abierto.
        </p>
      </Modal>
    </>
  )
}

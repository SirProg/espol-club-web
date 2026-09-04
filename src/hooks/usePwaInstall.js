/**
 * Instalación de la PWA.
 *
 * Chrome dispara `beforeinstallprompt` cuando le parece: exige que la persona
 * lleve un rato en el sitio y haya interactuado. No hay forma de adelantarlo
 * —es política del navegador, no una opción nuestra—, así que el botón **no**
 * espera a ese evento para mostrarse:
 *
 *  · `instalable` — el evento ya llegó: un toque y se instala.
 *  · `manual`     — todavía no, o el navegador no lo implementa: el botón
 *                   explica el gesto que toca en ese navegador.
 *  · `oculto`     — ya está instalada; entonces sí sobra.
 *
 * Hacer depender la visibilidad del evento dejaba el botón invisible durante el
 * primer medio minuto, que es justo cuando alguien decide si se queda.
 *
 * El evento se captura en el módulo, no en un `useEffect`: llega muy pronto y
 * un componente que se monta después —el drawer, que solo existe al abrirlo—
 * se suscribiría tarde y no lo vería nunca.
 */

import { useCallback, useSyncExternalStore } from 'react'

/** Qué gesto hay que explicar cuando no hay diálogo nativo. */
function detectarPlataforma() {
  if (typeof navigator === 'undefined') return 'otro'
  const ua = navigator.userAgent
  // El iPad moderno se anuncia como Mac; se distingue porque tiene táctil.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iPad|iPhone|iPod/.test(ua) || iPadOS) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Edg\//.test(ua)) return 'edge'
  if (/Chrome\//.test(ua)) return 'chrome'
  return 'otro'
}

function yaInstalada() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // La bandera propietaria de Safari cuando corre desde la pantalla de inicio.
    window.navigator.standalone === true
  )
}

/* ─────────────────  Estado compartido, fuera de React  ───────────────── */

let evento = null
let estado = { modo: 'oculto', instalando: false }
const suscriptores = new Set()

/** Sustituye el estado solo si cambió: getSnapshot debe ser estable. */
function fijar(parcial) {
  const siguiente = { ...estado, ...parcial }
  if (siguiente.modo === estado.modo && siguiente.instalando === estado.instalando) return
  estado = siguiente
  suscriptores.forEach((cb) => cb())
}

function recalcularModo() {
  if (yaInstalada()) return 'oculto'
  return evento ? 'instalable' : 'manual'
}

if (typeof window !== 'undefined') {
  fijar({ modo: recalcularModo() })

  window.addEventListener('beforeinstallprompt', (e) => {
    // Sin esto el navegador enseña su propio aviso cuando le parece.
    e.preventDefault()
    evento = e
    fijar({ modo: recalcularModo() })
  })

  window.addEventListener('appinstalled', () => {
    evento = null
    fijar({ modo: 'oculto', instalando: false })
  })

  window
    .matchMedia('(display-mode: standalone)')
    .addEventListener('change', () => fijar({ modo: recalcularModo() }))
}

function subscribe(cb) {
  suscriptores.add(cb)
  return () => suscriptores.delete(cb)
}

const getSnapshot = () => estado
const getServerSnapshot = () => estado

/* ────────────────────────────────  Hook  ─────────────────────────────── */

export function usePwaInstall() {
  const { modo, instalando } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const instalar = useCallback(async () => {
    if (!evento) return null
    fijar({ instalando: true })
    try {
      evento.prompt()
      const { outcome } = await evento.userChoice
      // El evento solo sirve una vez; el navegador emitirá otro si procede.
      evento = null
      fijar({ instalando: false, modo: recalcularModo() })
      return outcome
    } catch {
      fijar({ instalando: false })
      return null
    }
  }, [])

  return { modo, instalando, instalar, plataforma: detectarPlataforma() }
}

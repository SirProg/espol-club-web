import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { attendance } from '../../lib/api/endpoints'
import { useAuth } from '../../context/auth'
import { ROUTES } from '../../routing/modules'
import { fmtDateTime } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'

/**
 * Escáner QR del Staff (13) — V-07, RF-36.
 *
 * Dos caminos hacia el mismo endpoint, porque en la web la cámara no siempre
 * está disponible:
 *
 *  1. Cámara con `BarcodeDetector`, la API nativa del navegador. Evita cargar
 *     un decodificador propio, pero solo existe en Chrome/Edge sobre HTTPS (o
 *     localhost).
 *  2. Pegar el token a mano, que funciona siempre y sirve además cuando la
 *     pantalla del asistente no se deja leer.
 *
 * Quién puede escanear lo decide el servidor: solo el Staff asignado a ESE
 * evento (`not_event_staff`). Aquí no se adivina.
 */

const MENSAJES = {
  qr_already_used: 'Esta credencial ya se usó. La asistencia estaba registrada.',
  unknown_qr_token: 'El código no corresponde a ninguna credencial.',
  not_event_staff: 'No estás asignado como Staff de este evento.',
  outside_scan_window: 'Fuera del horario de escaneo del evento.',
}

export default function Escaner() {
  const { appRole } = useAuth()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const loopRef = useRef(null)

  const [soportaCamara] = useState(() => 'BarcodeDetector' in window)
  const [escaneando, setEscaneando] = useState(false)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [resultado, setResultado] = useState(null)

  const registrar = useCallback(async (valor) => {
    const limpio = valor.trim()
    if (!limpio) return
    setBusy(true)
    try {
      const data = await attendance.scan(limpio)
      setResultado({ ok: true, data })
      setToken('')
    } catch (err) {
      setResultado({ ok: false, mensaje: MENSAJES[err.code] ?? err.message })
    } finally {
      setBusy(false)
    }
  }, [])

  const detener = useCallback(() => {
    if (loopRef.current) {
      clearInterval(loopRef.current)
      loopRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setEscaneando(false)
  }, [])

  // La cámara se apaga al salir de la pantalla: dejarla encendida es una fuga
  // evidente y el indicador del dispositivo se queda en rojo.
  useEffect(() => detener, [detener])

  // El Staff se asigna entre los miembros del club (RF-35), así que un
  // estudiante sin club nunca podrá escanear nada: mejor no dejarle entrar a
  // una pantalla que solo puede devolverle un error.
  const esMiembro = appRole === 'Club Member' || appRole === 'Club Leader'
  if (!esMiembro) return <Navigate to={ROUTES.APP_INICIO} replace />

  async function iniciar() {
    setResultado(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      setEscaneando(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      loopRef.current = setInterval(async () => {
        if (!videoRef.current) return
        try {
          const codigos = await detector.detect(videoRef.current)
          if (codigos.length > 0) {
            const valor = codigos[0].rawValue
            detener()
            registrar(valor)
          }
        } catch {
          // Un fotograma ilegible no es un error: el siguiente puede servir.
        }
      }, 400)
    } catch {
      setResultado({
        ok: false,
        mensaje:
          'No se pudo abrir la cámara. Revisa los permisos del navegador o pega el código a mano.',
      })
      detener()
    }
  }

  return (
    <>
      <SectionTitle
        eyebrow="Mi cuenta"
        title="Escáner QR"
        description="Valida la asistencia de quienes llegan al evento."
      />

      <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
        <Card title="Cámara">
          {soportaCamara ? (
            <>
              <div className="overflow-hidden rounded-lg bg-surface-alt">
                {escaneando ? (
                  <video
                    ref={videoRef}
                    className="aspect-square w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center px-6 text-center">
                    <p className="t-caption">Apunta la cámara al QR de la credencial.</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                {escaneando ? (
                  <Button variant="secondary" onClick={detener}>
                    Detener
                  </Button>
                ) : (
                  <Button onClick={iniciar} disabled={busy}>
                    Abrir cámara
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p className="t-body text-ink-muted">
              Este navegador no puede leer códigos QR con la cámara. Usa Chrome o Edge, o
              escribe el código a mano aquí al lado.
            </p>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Código manual" subtitle="Siempre funciona">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                registrar(token)
              }}
              className="space-y-4"
              noValidate
            >
              <Field
                label="Token de la credencial"
                name="qr_token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Pega aquí el código"
              />
              <Button type="submit" disabled={busy || !token.trim()}>
                {busy ? 'Registrando…' : 'Registrar asistencia'}
              </Button>
            </form>
          </Card>

          {resultado && (
            <Card
              tone={resultado.ok ? 'success' : 'danger'}
              title={resultado.ok ? 'Asistencia registrada' : 'No se pudo registrar'}
            >
              {resultado.ok ? (
                <dl className="space-y-1">
                  <div className="flex justify-between gap-3">
                    <dt className="t-label">Estudiante</dt>
                    <dd className="t-body text-right">{resultado.data.student_name}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="t-label">Matrícula</dt>
                    <dd className="t-data">{resultado.data.enrollment}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="t-label">Evento</dt>
                    <dd className="t-body text-right">{resultado.data.event_name}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="t-label">Hora</dt>
                    <dd className="t-data">{fmtDateTime(resultado.data.scanned_at)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="t-body">{resultado.mensaje}</p>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

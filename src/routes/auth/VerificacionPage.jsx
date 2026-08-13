import { useState } from 'react'
import { Link } from 'react-router-dom'

import { auth } from '../../lib/api/endpoints'
import Field from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import AuthLayout from './AuthLayout'

/**
 * Verificación de cuenta por correo (RF-01). El enlace del correo lleva a
 * /verificacion con el token en el query; aquí se consumen ambos caminos:
 * con token (desde el correo) y sin él (solo reenvío).
 */
export default function VerificacionPage() {
  const tokenFromUrl = new URLSearchParams(window.location.search).get('token')
  const [token, setToken] = useState(tokenFromUrl ?? '')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function verify(event) {
    event?.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const data = await auth.verify(token)
      setMessage(data.message)
      setToken('')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function resend(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const data = await auth.resendVerification(email)
      setMessage(data.message)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Verifica tu correo"
      eyebrow="Activación de cuenta"
      children={
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="t-heading">Con el enlace del correo</h2>
            <p className="t-caption mt-1">
              Si abriste esta página desde el enlace, el token ya está cargado:
            </p>
            <form onSubmit={verify} className="mt-3 flex gap-2" noValidate>
              <Field
                name="token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="flex-1"
                placeholder="Token de verificación"
                error={error?.forField('token')}
              />
              <Button type="submit" disabled={busy || !token} className="self-end">
                {busy ? 'Verificando…' : 'Verificar'}
              </Button>
            </form>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="t-heading">¿No llegó el enlace?</h2>
            <form onSubmit={resend} className="mt-3 flex gap-2" noValidate>
              <Field
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex-1"
                placeholder="tu correo @espol.edu.ec"
                error={error?.forField('email')}
              />
              <Button type="submit" variant="secondary" disabled={busy || !email} className="self-end">
                Reenviar
              </Button>
            </form>
          </div>

          {message && (
            <div className="rounded-md bg-success-soft px-3 py-2 text-sm text-success">
              {message}
            </div>
          )}
          {error && !error.forField('token') && !error.forField('email') && (
            <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error.message}
            </div>
          )}

          <p className="t-caption">
            <Link to="/login" className="font-semibold text-primary underline">
              Ir a iniciar sesión
            </Link>
          </p>
        </div>
      }
    />
  )
}

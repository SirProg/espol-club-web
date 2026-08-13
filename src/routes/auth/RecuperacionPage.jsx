import { useState } from 'react'
import { Link } from 'react-router-dom'

import { auth } from '../../lib/api/endpoints'
import Field from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import AuthLayout from './AuthLayout'

/**
 * Restablecimiento de contraseña (RF-03). Con `uid` + `token` en la URL (desde
 * el correo) muestra el formulario de nueva contraseña; sin ellos, el de
 * solicitud de enlace.
 */
export default function RecuperacionPage() {
  const params = new URLSearchParams(window.location.search)
  const hasResetLink = params.has('uid') && params.has('token')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function request(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const data = await auth.requestPasswordReset(email)
      setMessage(data.message)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function confirm(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const data = await auth.confirmPasswordReset({
        uid: params.get('uid'),
        token: params.get('token'),
        password,
        password_confirm: passwordConfirm,
      })
      setMessage(data.message)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (hasResetLink && message) {
    return (
      <AuthLayout title="Contraseña actualizada" eyebrow="Recuperación">
        <div className="mt-6 space-y-4">
          <div className="rounded-md bg-success-soft px-3 py-2 text-sm text-success">{message}</div>
          <Button onClick={() => (window.location.href = '/login')} className="w-full">
            Ir a iniciar sesión
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title={hasResetLink ? 'Nueva contraseña' : 'Recupera tu acceso'}
      eyebrow="Recuperación de contraseña"
      children={
        hasResetLink ? (
          <form onSubmit={confirm} className="mt-6 space-y-4" noValidate>
            <Field
              label="Nueva contraseña"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={error?.forField('password')}
              autoComplete="new-password"
              required
            />
            <Field
              label="Repite la nueva contraseña"
              name="password_confirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              error={error?.forField('password_confirm')}
              autoComplete="new-password"
              required
            />
            {error && !error.forField('password') && !error.forField('password_confirm') && (
              <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error.message}</div>
            )}
            <Button type="submit" className="w-full" disabled={busy || !password || !passwordConfirm}>
              {busy ? 'Guardando…' : 'Guardar nueva contraseña'}
            </Button>
          </form>
        ) : (
          <form onSubmit={request} className="mt-6 space-y-4" noValidate>
            <Field
              label="Correo institucional"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error?.forField('email')}
              placeholder="usuario@espol.edu.ec"
              required
            />
            {error && !error.forField('email') && (
              <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error.message}</div>
            )}
            {message && <div className="rounded-md bg-success-soft px-3 py-2 text-sm text-success">{message}</div>}
            <Button type="submit" className="w-full" disabled={busy || !email}>
              {busy ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </Button>
            <p className="t-caption text-center">
              <Link to="/login" className="font-semibold text-primary underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </form>
        )
      }
    />
  )
}

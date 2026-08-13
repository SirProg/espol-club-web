import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/auth'
import { ROLE_HOME } from '../../routing/modules'
import Field from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import AuthLayout from './AuthLayout'

/**
 * Login (RF-02). `identifier` acepta matrícula o correo institucional.
 * Los errores del API (invalid_credentials, account_not_verified) se pintan en
 * el pie del formulario; con "no verificada" se ofrece el enlace de reenvío.
 */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const notVerified = error?.code === 'account_not_verified'

  async function onSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const session = await login(identifier, password)
      navigate(ROLE_HOME[session.app_role] ?? '/', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Inicia sesión"
      eyebrow="Panel de gestión"
      children={
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field
            label="Matrícula o correo institucional"
            name="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            error={error?.forField('identifier')}
            required
          />
          <Field
            label="Contraseña"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            error={error?.forField('password')}
            required
          />

          {error && !error.forField('identifier') && !error.forField('password') && (
            <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              <p>{error.message}</p>
              {notVerified && (
                <Link to="/verificacion" className="mt-1 inline-block font-semibold underline">
                  Reenviar el enlace de verificación
                </Link>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link to="/recuperacion" className="t-caption text-primary underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={busy || !identifier || !password}>
            {busy ? 'Entrando…' : 'Iniciar sesión'}
          </Button>

          <p className="t-caption text-center">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-primary underline">
              Regístrate
            </Link>
          </p>
        </form>
      }
    />
  )
}

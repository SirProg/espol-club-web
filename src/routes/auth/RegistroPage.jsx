import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { auth, catalogs } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import Field from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import AuthLayout from './AuthLayout'

/**
 * Registro (RF-01, RF-05). Tras crearse la cuenta se pide verificar el correo
 * institucional antes de poder entrar; el aviso de éxito da el camino.
 */
export default function RegistroPage() {
  const navigate = useNavigate()

  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const { data: catalogsData } = useApi(catalogFetcher)
  const faculties = catalogsData?.faculties ?? []

  const [form, setForm] = useState({
    enrollment: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    birth_date: '',
    faculty: '',
    career: '',
    semester: '',
  })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(false)

  function set(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const payload = {
        enrollment: form.enrollment,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        password_confirm: form.password_confirm,
        birth_date: form.birth_date || null,
        faculty: form.faculty || null,
        career: form.career,
        semester: form.semester ? Number(form.semester) : null,
      }
      await auth.register(payload)
      setCreated(true)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (created) {
    return (
      <AuthLayout title="Revisa tu correo" eyebrow="Registro">
        <div className="mt-6 rounded-md bg-success-soft px-4 py-3 text-sm text-success">
          Cuenta creada. Te enviamos un enlace a tu correo institucional para
          verificar tu cuenta antes de iniciar sesión.
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Link to="/verificacion" className="t-caption text-primary underline">
            Reenviar el enlace
          </Link>
          <Button onClick={() => navigate('/login')}>Ir a iniciar sesión</Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      eyebrow="Registro de estudiante"
      children={
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Matrícula"
              name="enrollment"
              value={form.enrollment}
              onChange={set('enrollment')}
              error={error?.forField('enrollment')}
              placeholder="2019XXXX"
              required
            />
            <Field
              label="Correo institucional"
              name="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={error?.forField('email')}
              placeholder="usuario@espol.edu.ec"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Nombres"
              name="first_name"
              value={form.first_name}
              onChange={set('first_name')}
              error={error?.forField('first_name')}
              required
            />
            <Field
              label="Apellidos"
              name="last_name"
              value={form.last_name}
              onChange={set('last_name')}
              error={error?.forField('last_name')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={set('password')}
              error={error?.forField('password')}
              autoComplete="new-password"
              hint="Mínimo 8 caracteres."
              required
            />
            <Field
              label="Repite la contraseña"
              name="password_confirm"
              type="password"
              value={form.password_confirm}
              onChange={set('password_confirm')}
              error={error?.forField('password_confirm')}
              autoComplete="new-password"
              required
            />
          </div>

          <details className="rounded-md bg-surface ring-1 ring-border">
            <summary className="cursor-pointer px-3 py-2 t-label">
              Datos académicos (opcional)
            </summary>
            <div className="space-y-3 px-3 pb-3">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Fecha de nacimiento"
                  name="birth_date"
                  type="date"
                  value={form.birth_date}
                  onChange={set('birth_date')}
                  error={error?.forField('birth_date')}
                />
                <Field
                  label="Semestre"
                  name="semester"
                  type="number"
                  min="1"
                  max="20"
                  value={form.semester}
                  onChange={set('semester')}
                  error={error?.forField('semester')}
                />
              </div>
              <Field
                label="Facultad"
                name="faculty"
                value={form.faculty}
                onChange={set('faculty')}
                error={error?.forField('faculty')}
                className="gap-1"
                children={
                  <select
                    name="faculty"
                    value={form.faculty}
                    onChange={set('faculty')}
                    className="input"
                  >
                    <option value="">Selecciona…</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.code}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                }
              />
              <Field
                label="Carrera"
                name="career"
                value={form.career}
                onChange={set('career')}
                error={error?.forField('career')}
              />
            </div>
          </details>

          {error && (
            <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error.message}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>

          <p className="t-caption text-center">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-primary underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      }
    />
  )
}

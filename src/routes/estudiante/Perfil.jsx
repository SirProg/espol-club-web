import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { profile } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { ROUTES, ROLE_LABELS } from '../../routing/modules'
import { label, statusTone } from '../../lib/enums'
import { fmtDate } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InfoRow from '../../components/ui/InfoRow'
import ChipList from '../../components/ui/ChipList'
import ThemeSwitch from '../../components/ui/ThemeSwitch'
import { useToast } from '../../components/ui/toast-context'

/**
 * Perfil del estudiante (14) — V-09, F-07.
 *
 * Los datos institucionales (matrícula, nombre, correo, facultad, carrera)
 * llegan del SAAC y son de solo lectura: el serializer de escritura solo acepta
 * `description`, `skills` y `social_media`. Mostrarlos igualmente, apagados,
 * evita que alguien los busque en otra pantalla.
 */
export default function Perfil() {
  const { session, logout } = useAuth()

  const fetcher = useCallback(() => profile.get(), [])
  const { data, loading, error, reload } = useApi(fetcher)

  if (loading) return <p className="t-caption">Cargando…</p>
  if (error) return <p className="text-sm text-danger">No se pudo cargar tu perfil.</p>

  const membresias = session?.memberships ?? []

  return (
    <>
      <SectionTitle
        eyebrow="Mi cuenta"
        title={data.full_name}
        description={ROLE_LABELS[session?.app_role] ?? session?.app_role}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card title="Datos institucionales" subtitle="Vienen de la ESPOL y no se editan aquí">
            <dl>
              <InfoRow label="Matrícula" value={data.enrollment} mono />
              <InfoRow label="Correo" value={data.email} />
              <InfoRow label="Facultad" value={data.faculty?.name ?? '—'} />
              <InfoRow label="Carrera" value={data.career || '—'} />
              <InfoRow label="Semestre" value={data.semester ? String(data.semester) : '—'} mono />
              <InfoRow
                label="Nacimiento"
                value={data.birth_date ? `${fmtDate(data.birth_date)} (${data.age} años)` : '—'}
              />
            </dl>
          </Card>

          {/* La `key` reinicia el formulario cuando llegan datos nuevos del
              servidor: es el reemplazo idiomático de sincronizar el estado con
              un efecto, y evita renders en cascada. */}
          <SobreMi key={JSON.stringify(data.social_media) + data.description} perfil={data} onSaved={reload} />
        </div>

        <div className="space-y-4">
          <Card title="Mis clubes">
            {membresias.length === 0 ? (
              <p className="t-body text-ink-muted">
                Aún no perteneces a ningún club.{' '}
                <Link to={ROUTES.APP_CLUBES} className="text-primary underline underline-offset-2">
                  Explora el catálogo
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {membresias.map((m) => (
                  <li key={m.club_id} className="py-2.5">
                    <Link
                      to={ROUTES.APP_CLUB.replace(':clubId', m.club_id)}
                      className="flex items-start justify-between gap-3 hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="t-body truncate font-medium">{m.club_name}</p>
                        <p className="t-caption">{m.role_name}</p>
                      </div>
                      <Badge text={label(m.club_status)} tone={statusTone(m.club_status)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Habilidades registradas">
            <ChipList items={data.skills ?? []} tone="primary" />
          </Card>

          <Card title="Apariencia">
            <p className="t-caption mb-3">Elige el tema o deja que siga al sistema.</p>
            <ThemeSwitch />
          </Card>

          <Card title="Sesión">
            <Button variant="secondary" onClick={logout}>
              Cerrar sesión
            </Button>
          </Card>
        </div>
      </div>
    </>
  )
}

/**
 * Bloque editable del perfil. Vive aparte para que su estado se inicialice
 * desde las props una sola vez y se reinicie con la `key` del padre.
 */
function SobreMi({ perfil, onSaved }) {
  const toast = useToast()

  const [descripcion, setDescripcion] = useState(perfil.description ?? '')
  const [habilidades, setHabilidades] = useState((perfil.skills ?? []).join(', '))
  const [redes, setRedes] = useState(perfil.social_media ?? [])
  const [busy, setBusy] = useState(false)
  const [problema, setProblema] = useState(null)

  function actualizarRed(index, patch) {
    setRedes((current) =>
      current.map((red, i) => (i === index ? { ...red, ...patch } : red)),
    )
  }

  async function guardar(event) {
    event.preventDefault()
    setProblema(null)

    const limpias = redes
      .map((red) => ({ network: red.network?.trim() ?? '', link: red.link?.trim() ?? '' }))
      .filter((red) => red.network || red.link)

    for (const red of limpias) {
      if (!red.network) {
        setProblema('Cada red social necesita un nombre.')
        return
      }
      try {
        new URL(red.link)
      } catch {
        setProblema(`El enlace de ${red.network} no es una URL válida.`)
        return
      }
    }

    setBusy(true)
    try {
      await profile.update({
        description: descripcion.trim(),
        skills: habilidades
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        social_media: limpias,
      })
      toast.toast('Perfil actualizado.', 'success')
      onSaved()
    } catch (err) {
      setProblema(err.forField?.('skills') ?? err.forField?.('social_media') ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Sobre mí" subtitle="Esto sí lo controlas tú">
      <form onSubmit={guardar} noValidate className="space-y-4">
        <Field
          label="Descripción"
          name="description"
          hint="Una o dos frases para que los clubes sepan quién eres."
        >
          <textarea
            className="input"
            rows={3}
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            placeholder="Estudio Computación y me interesa el software libre."
          />
        </Field>

        <Field
          label="Habilidades"
          name="skills"
          value={habilidades}
          onChange={(event) => setHabilidades(event.target.value)}
          placeholder="Python, diseño gráfico, oratoria"
          hint="Sepáralas con comas."
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="t-label">Redes sociales</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRedes((current) => [...current, { network: '', link: '' }])}
            >
              Añadir red
            </Button>
          </div>

          {redes.length === 0 ? (
            <p className="t-caption">Todavía no has añadido ninguna.</p>
          ) : (
            <ul className="space-y-2">
              {redes.map((red, index) => (
                <li key={index} className="flex flex-wrap items-end gap-2">
                  <input
                    className="input sm:w-40"
                    value={red.network ?? ''}
                    onChange={(event) => actualizarRed(index, { network: event.target.value })}
                    placeholder="Instagram"
                    aria-label={`Nombre de la red ${index + 1}`}
                  />
                  <input
                    className="input flex-1"
                    type="url"
                    value={red.link ?? ''}
                    onChange={(event) => actualizarRed(index, { link: event.target.value })}
                    placeholder="https://instagram.com/tu-usuario"
                    aria-label={`Enlace de la red ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setRedes((current) => current.filter((_, i) => i !== index))}
                  >
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {problema && <p className="text-xs font-medium text-danger">{problema}</p>}

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

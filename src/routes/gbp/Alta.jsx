import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { catalogs, clubs } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { ROUTES } from '../../routing/modules'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Field from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import DesktopOnly from '../../components/ui/DesktopOnly'
import { useToast } from '../../components/ui/toast-context'

/**
 * Alta de club (29) — F-17, RF-11, RF-14.
 *
 * Crea el club y, si la matrícula del líder corresponde a una cuenta ya
 * verificada, lo vincula; si no, el club nace en «Pending Leader» y el aviso
 * se muestra en su detalle (V-22). Gestión exclusiva de escritorio (RF-54).
 */
export default function Alta() {
  const navigate = useNavigate()
  const toast = useToast()

  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const catalogsData = useApi(catalogFetcher)

  const [name, setName] = useState('')
  const [acronym, setAcronym] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [areaIds, setAreaIds] = useState([])
  const [leaderEnrollment, setLeaderEnrollment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const faculties = catalogsData.data?.faculties ?? []
  const areas = catalogsData.data?.interest_areas ?? []

  function toggleArea(areaId) {
    setAreaIds((current) =>
      current.includes(areaId)
        ? current.filter((id) => id !== areaId)
        : [...current, areaId],
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const club = await clubs.create({
        name: name.trim(),
        acronym: acronym.trim(),
        description: description.trim(),
        location: location.trim(),
        faculty_id: facultyId ? Number(facultyId) : null,
        interest_area_ids: areaIds,
        leader_enrollment: leaderEnrollment.trim(),
      })
      toast.toast('Club creado.', 'success')
      navigate(ROUTES.GBP_DETALLE.replace(':clubId', club.id))
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SectionTitle
        eyebrow="Institución"
        title="Alta de club"
        description="Registra un club nuevo y vincúlalo con su líder (F-17)."
      />

      <DesktopOnly>
        <Card title="Datos del club">
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Club de Robótica y Automatización"
              error={error?.forField('name')}
              required
            />
            <Field
              label="Acrónimo (sigla)"
              name="acronym"
              value={acronym}
              onChange={(event) => setAcronym(event.target.value)}
              placeholder="CRA"
              error={error?.forField('acronym')}
              required
            />
          </div>

          <Field
            label="Descripción"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="¿Qué hace este club y a quién va dirigido?"
            error={error?.forField('description')}
            required
            children={
              <textarea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="¿Qué hace este club y a quién va dirigido?"
                rows={3}
                required
                className={`input ${error?.forField('description') ? 'input-invalid' : ''}`}
              />
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Ubicación"
              name="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Edificio 27, aulas 8-10"
              error={error?.forField('location')}
              required
            />
            <Field
              label="Facultad"
              name="faculty_id"
              error={error?.forField('faculty_id')}
              className="gap-1"
              children={
                <select
                  name="faculty_id"
                  value={facultyId}
                  onChange={(event) => setFacultyId(event.target.value)}
                  className="input"
                >
                  <option value="">Sin facultad</option>
                  {faculties.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              }
            />
          </div>

          <Field
            label="Áreas de interés"
            name="interest_area_ids"
            error={error?.forField('interest_area_ids')}
            hint={areaIds.length === 0 ? 'Selecciona al menos una área (F-17).' : `${areaIds.length} seleccionada${areaIds.length === 1 ? '' : 's'}`}
          >
            <div className="flex flex-wrap gap-2">
              {areas.map((item) => {
                const active = areaIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleArea(item.id)}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-alt text-ink ring-1 ring-border hover:ring-primary'
                    }`}
                  >
                    {item.name}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field
            label="Matrícula del líder"
            name="leader_enrollment"
            value={leaderEnrollment}
            onChange={(event) => setLeaderEnrollment(event.target.value)}
            placeholder="2018xxxxx"
            error={error?.forField('leader_enrollment')}
            hint="Si la matrícula no tiene cuenta verificada, el club queda en «Pending Leader»."
            required
          />

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" disabled={busy || catalogsData.loading}>
              {busy ? 'Creando…' : 'Crear club'}
            </Button>
          </div>
        </form>
      </Card>
      </DesktopOnly>
    </>
  )
}

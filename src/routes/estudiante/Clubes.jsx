import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { catalogs, clubs } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { ROUTES } from '../../routing/modules'
import { label, statusTone } from '../../lib/enums'
import { plural } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Badge from '../../components/ui/Badge'
import Pennant from '../../components/ui/Pennant'
import EmptyState from '../../components/ui/EmptyState'

/**
 * Catálogo de clubes (6) — F-04, V-01. El eje prioritario del producto:
 * descubrir qué comunidades existen (MASTER §1.3).
 *
 * El servidor no filtra ni pagina de verdad, así que trae los clubes una vez y
 * el filtrado ocurre aquí. Son ~20 filas: filtrar en el cliente es instantáneo
 * y evita un viaje por cada tecla.
 *
 * V-01: la tarjeta muestra **solo el contador** de miembros. La nómina es
 * interna y no sale del detalle (RN-3).
 */
export default function Clubes() {
  const clubsFetcher = useCallback(() => clubs.list(), [])
  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const allClubs = useApi(clubsFetcher)
  const catalogData = useApi(catalogFetcher)

  const [search, setSearch] = useState('')
  const [faculty, setFaculty] = useState('')
  const [area, setArea] = useState('')

  const faculties = catalogData.data?.faculties ?? []
  const areas = catalogData.data?.interest_areas ?? []

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (allClubs.data ?? []).filter((club) => {
      if (term && !`${club.name} ${club.acronym}`.toLowerCase().includes(term)) return false
      if (faculty && String(club.faculty) !== String(faculty)) return false
      if (area && !(club.interest_areas ?? []).some((a) => String(a.id) === String(area))) {
        return false
      }
      return true
    })
  }, [allClubs.data, search, faculty, area])

  const filtrando = Boolean(search || faculty || area)

  return (
    <>
      <SectionTitle
        eyebrow="Mi espacio"
        title="Clubes"
        description="Explora las comunidades estudiantiles de la ESPOL."
        hint={allClubs.data ? plural(visible.length, 'club', 'clubes') : undefined}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="t-label">Buscar</span>
          <input
            type="search"
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre o sigla"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">Facultad</span>
          <select
            className="input"
            value={faculty}
            onChange={(event) => setFaculty(event.target.value)}
          >
            <option value="">Todas</option>
            {faculties.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} — {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="t-label">Área de interés</span>
          <select className="input" value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="">Todas</option>
            {areas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {allClubs.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : allClubs.error ? (
        <p className="text-sm text-danger">
          No se pudo cargar el catálogo. Reintenta en un momento.
        </p>
      ) : visible.length === 0 ? (
        <EmptyState
          message={
            filtrando
              ? 'No se encontraron clubes con esos filtros.'
              : 'Todavía no hay clubes publicados.'
          }
          hint={filtrando ? 'Prueba con otra facultad o quita el área de interés.' : undefined}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((club) => (
            <li key={club.id}>
              <Link
                to={ROUTES.APP_CLUB.replace(':clubId', club.id)}
                className="flex h-full gap-4 rounded-[10px] bg-surface p-4 shadow-card ring-1 ring-border transition-colors hover:ring-primary"
              >
                <Pennant text={club.acronym} width={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="t-heading leading-tight">{club.name}</p>
                    {club.status !== 'Active' && (
                      <Badge text={label(club.status)} tone={statusTone(club.status)} />
                    )}
                  </div>
                  <p className="t-data mt-1">{club.acronym}</p>
                  <p className="t-caption mt-2 line-clamp-3">{club.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {(club.interest_areas ?? []).slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="rounded-[6px] bg-surface-alt px-2 py-0.5 text-[11px] font-medium text-ink-muted"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                  <p className="t-caption mt-3">
                    {club.faculty_code ?? '—'} ·{' '}
                    {plural(club.members_count, 'miembro', 'miembros')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

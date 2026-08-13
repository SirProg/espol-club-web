import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { catalogs, clubs } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { label, statusTone } from '../../lib/enums'
import { ROUTES } from '../../routing/modules'
import SectionTitle from '../../components/ui/SectionTitle'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import EmptyState from '../../components/ui/EmptyState'
import DesktopOnly from '../../components/ui/DesktopOnly'

/**
 * Catálogo global de clubes (28) — el punto de entrada de GBP.
 * Búsqueda por nombre/sigla y filtros por facultad y área de interés.
 * El API devuelve la tabla completa; filtrar es trabajo del cliente.
 */
export default function Catalogo() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [faculty, setFaculty] = useState('')
  const [area, setArea] = useState('')

  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const clubsFetcher = useCallback(() => clubs.list({}), [])

  const catalogsData = useApi(catalogFetcher)
  const allClubs = useApi(clubsFetcher)

  const faculties = catalogsData.data?.faculties ?? []
  const areas = catalogsData.data?.interest_areas ?? []

  const rows = (allClubs.data ?? [])
    .filter((club) => {
      const query = search.trim().toLowerCase()
      if (query) {
        const haystack = `${club.name} ${club.acronym}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (faculty && String(club.faculty) !== String(faculty)) return false
      if (area && !(club.interest_areas ?? []).some((item) => item.id === Number(area))) return false
      return true
    })
    .map((club) => ({
      ...club,
      __stripe: statusTone(club.status),
      __right: <Badge text={label(club.status)} tone={statusTone(club.status)} />,
    }))

  const columns = [
    { key: 'name', header: 'Club', mobileMain: true },
    { key: 'acronym', header: 'Sigla', mono: true, className: 'hidden md:table-cell' },
    { key: 'faculty_name', header: 'Facultad', className: 'hidden lg:table-cell' },
    { key: 'location', header: 'Ubicación', className: 'hidden lg:table-cell' },
    {
      key: 'members_count',
      header: 'Miembros',
      mono: true,
      render: (row) => row.members_count ?? 0,
    },
    {
      key: 'status',
      header: 'Estado',
      // En móvil el estado ya va en el badge de la esquina de la tarjeta.
      mobile: false,
      render: (row) => <Badge text={label(row.status)} tone={statusTone(row.status)} />,
    },
  ]

  return (
    <>
      <SectionTitle
        eyebrow="Institución"
        title="Catálogo de clubes"
        description="Descubre y administra los clubes de la ESPOL."
      >
        <DesktopOnly>
          <Link to={ROUTES.GBP_ALTA}>
            <Button size="sm">Alta de club</Button>
          </Link>
        </DesktopOnly>
      </SectionTitle>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Buscar"
          name="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre o sigla"
          className="sm:col-span-2 lg:col-span-1"
        />
        <Field
          label="Facultad"
          name="faculty"
          className="gap-1"
          children={
            <select
              name="faculty"
              value={faculty}
              onChange={(event) => setFaculty(event.target.value)}
              className="input"
            >
              <option value="">Todas</option>
              {faculties.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Área de interés"
          name="area"
          className="gap-1"
          children={
            <select
              name="area"
              value={area}
              onChange={(event) => setArea(event.target.value)}
              className="input"
            >
              <option value="">Todas</option>
              {areas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          }
        />
      </div>

      {allClubs.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <Table
          columns={columns}
          rows={rows}
          rowKey="id"
          onRowClick={(row) => navigate(ROUTES.GBP_DETALLE.replace(':clubId', row.id))}
          empty={
            // Sin filtros el catálogo está realmente vacío (V-21); con filtros
            // lo que falla es la búsqueda. Decir "no hay clubes registrados"
            // cuando solo sobra un filtro manda a buscar el problema donde no está.
            search || faculty || area ? (
              <EmptyState
                message="No hay clubes que coincidan con tu búsqueda."
                hint="Ajusta los filtros o da de alta un club nuevo."
              />
            ) : (
              <EmptyState
                message="No hay clubes registrados."
                hint="Da de alta el primero desde «Alta de club»."
              />
            )
          }
        />
      )}
    </>
  )
}

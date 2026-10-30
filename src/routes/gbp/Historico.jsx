import { useCallback, useState } from 'react'

import { catalogs, gbp } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import SectionTitle from '../../components/ui/SectionTitle'
import Table from '../../components/ui/Table'
import Field from '../../components/ui/Field'
import EmptyState from '../../components/ui/EmptyState'

/**
 * Histórico por PAO (33) — RF-49, V-25.
 *
 * Reconstruye qué clubes existían en un período pasado, quién los lideraba y
 * con cuántos miembros, a partir de la nómina congelada en la BD. El PAO es
 * obligatorio; por defecto se consulta el vigente.
 */
export default function Historico() {
  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const catalogsData = useApi(catalogFetcher)

  const [pao, setPao] = useState('')

  // Sin setState en efectos: el valor efectivo deriva del estado elegido y,
  // si aún no hay elección, del período activo (patrón null-as-untouched).
  const effectivePao = pao || catalogsData.data?.active_pao || ''

  const historyFetcher = useCallback(() => {
    if (!effectivePao) return Promise.resolve({ pao_period: null, clubs: [] })
    return gbp.history(effectivePao)
  }, [effectivePao])
  const history = useApi(historyFetcher)

  const periods = catalogsData.data?.pao_periods ?? []
  const clubs = history.data?.clubs ?? []

  const rows = clubs.map((club) => ({
    ...club,
    __key: `${club.club_id}-${history.data?.pao_period}`,
    club: (
      <div>
        <div className="t-body font-medium">{club.name}</div>
        <div className="t-caption tabular-nums">{club.acronym}</div>
      </div>
    ),
    líder: club.leader ? (
      <div>
        <div className="t-body font-medium">{club.leader.full_name}</div>
        <div className="t-caption tabular-nums">{club.leader.enrollment}</div>
      </div>
    ) : (
      <span className="t-caption">Sin líder registrado</span>
    ),
    total: club.members_count ?? 0,
    activos: club.active_members ?? 0,
  }))

  const columns = [
    { key: 'club', header: 'Club', mobileMain: true },
    { key: 'faculty', header: 'Facultad', mono: true, className: 'hidden md:table-cell' },
    { key: 'líder', header: 'Líder', className: 'hidden sm:table-cell' },
    { key: 'total', header: 'Miembros', mono: true, className: 'text-right' },
    { key: 'activos', header: 'Activos', mono: true, className: 'hidden lg:table-cell text-right' },
  ]

  return (
    <>
      <SectionTitle
        eyebrow="Institución"
        title="Histórico por PAO"
        description="Revisa la evidencia institucional de semestres anteriores (RF-49)."
      />

      <div className="mb-4 max-w-md">
        <Field
          label="Período"
          name="pao"
          className="gap-1"
          children={
            <select
              name="pao"
              value={effectivePao}
              onChange={(event) => setPao(event.target.value)}
              className="input"
            >
              <option value="">Selecciona un período</option>
              {periods.map((period) => (
                <option key={period.pao_period} value={period.pao_period}>
                  {period.pao_period}
                </option>
              ))}
            </select>
          }
        />
      </div>

      {history.loading || (catalogsData.loading && !effectivePao) ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <>
          {effectivePao && (
            <p className="t-caption mb-3">
              {history.data?.pao_period ?? effectivePao} · {clubs.length} club{clubs.length === 1 ? '' : 'es'} con nómina registrada
            </p>
          )}
          <Table
            columns={columns}
            rows={rows}
            rowKey="__key"
            empty={
              <EmptyState
                message="No hay información histórica para este período."
                hint="Elige otro período o espera a que se registren clubes en él."
              />
            }
          />
        </>
      )}
    </>
  )
}

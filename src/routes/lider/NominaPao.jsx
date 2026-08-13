import { useCallback, useMemo, useState } from 'react'

import { catalogs, clubs } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { PERMISSIONS } from '../../lib/enums'
import { fmtDate, plural } from '../../lib/format'
import SectionTitle from '../../components/ui/SectionTitle'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import EmptyState from '../../components/ui/EmptyState'
import DesktopOnly from '../../components/ui/DesktopOnly'
import { useToast } from '../../components/ui/toast-context'

/**
 * Renovación de nómina por PAO (26) — RF-39, RF-21 (transición M5).
 *
 * Se consulta la nómina de un período (los cerrados quedan congelados como
 * evidencia) y se renueva hacia el PAO activo, que el servidor fija: no hay
 * selector de destino. Renovar crea membresías nuevas; las del período
 * anterior no se tocan. La selección y el botón se difieren al escritorio.
 */
export default function NominaPao() {
  const { ledClubId, can } = useAuth()
  const toast = useToast()

  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const catalogsData = useApi(catalogFetcher)

  const periods = useMemo(() => {
    const items = [...(catalogsData.data?.pao_periods ?? [])].sort(
      (a, b) => (b.sequence ?? 0) - (a.sequence ?? 0),
    )
    return items
  }, [catalogsData.data])

  const activePao = catalogsData.data?.active_pao ?? null
  const [pao, setPao] = useState(null)

  const defaultPao = useMemo(() => {
    if (pao) return pao
    if (catalogsData.data?.active_pao && periods.length > 0) {
      return periods.find((period) => period.pao_period !== catalogsData.data.active_pao)
        ?.pao_period
    }
    return undefined
  }, [pao, periods, catalogsData.data])

  const rosterFetcher = useCallback(() => {
    const target = pao ?? defaultPao
    return target ? clubs.roster(ledClubId, target) : Promise.resolve([])
  }, [ledClubId, pao, defaultPao])

  const activeRosterFetcher = useCallback(() => {
    return activePao ? clubs.roster(ledClubId, activePao) : Promise.resolve([])
  }, [ledClubId, activePao])

  const roster = useApi(rosterFetcher)
  const activeRoster = useApi(activeRosterFetcher)

  const canManage = can(PERMISSIONS.MANAGE_MEMBERS)

  const [selected, setSelected] = useState(() => new Set())
  const [busy, setBusy] = useState(false)

  const renewedByStudent = useMemo(() => {
    return new Set((activeRoster.data ?? []).map((member) => member.student_id))
  }, [activeRoster.data])

  function toggle(membershipId) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(membershipId)) next.delete(membershipId)
      else next.add(membershipId)
      return next
    })
  }

  function toggleAll(rows) {
    const renewable = rows.filter((row) => !row.renewed)
    const allSelected = renewable.length > 0 && renewable.every((row) => selected.has(row.id))
    setSelected(new Set(allSelected ? [] : renewable.map((row) => row.id)))
  }

  async function renew() {
    if (selected.size === 0) return
    setBusy(true)
    try {
      const result = await clubs.renewRoster(ledClubId, [...selected])
      const renewedCount = result.renewed?.length ?? 0
      const skippedCount = result.skipped?.length ?? 0
      if (skippedCount > 0) {
        toast.toast(
          `${plural(renewedCount, 'miembro renovado', 'miembros renovados')}, ${plural(skippedCount, 'omitido', 'omitidos')} por estar ya en ${activePao}.`,
          'success',
        )
      } else {
        toast.toast(
          `${plural(renewedCount, 'miembro renovado', 'miembros renovados')} hacia ${activePao}.`,
          'success',
        )
      }
      setSelected(new Set())
      roster.reload()
      activeRoster.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setBusy(false)
    }
  }

  const rows = (roster.data ?? []).map((member) => {
    const alreadyRenewed = member.pao_period === activePao || renewedByStudent.has(member.student_id)
    return {
      ...member,
      renewed: alreadyRenewed,
      __stripe: alreadyRenewed ? 'success' : 'neutral',
      __select: (
        <input
          type="checkbox"
          aria-label={`Seleccionar a ${member.full_name}`}
          checked={selected.has(member.id)}
          onChange={() => toggle(member.id)}
          disabled={alreadyRenewed}
          className="checkbox"
        />
      ),
      miembro: (
        <div>
          <div className="t-body font-medium">{member.full_name}</div>
          <div className="t-caption font-mono">{member.enrollment}</div>
        </div>
      ),
      vigencia: `${fmtDate(member.valid_from)} → ${fmtDate(member.valid_until)}`,
      estado: (
        <Badge text={member.status_label} tone={member.status === 'Active' ? 'success' : 'warning'} />
      ),
      renovado: alreadyRenewed ? <Badge text="Renovado" tone="success" /> : null,
    }
  })

  const columns = [
    { key: '__select', header: '', mobile: false, className: 'w-10', render: (row) => row.__select },
    { key: 'miembro', header: 'Miembro', mobileMain: true },
    { key: 'role_name', header: 'Rol', className: 'hidden md:table-cell' },
    { key: 'vigencia', header: 'Vigencia', mono: true, className: 'hidden lg:table-cell' },
    { key: 'estado', header: 'Estado', render: (row) => row.estado },
    {
      key: 'renovado',
      header: 'Renovación',
      className: 'hidden md:table-cell',
      render: (row) => row.renovado ?? <span className="t-caption">—</span>,
    },
  ]

  const renewable = rows.filter((row) => !row.renewed)
  const allSelected =
    renewable.length > 0 && renewable.every((row) => selected.has(row.id))

  return (
    <>
      <SectionTitle
        eyebrow="Gestión del club"
        title="Nómina PAO"
        description="Renueva la nómina de un período cerrado hacia el PAO activo."
      />

      {catalogsData.loading || roster.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <>
          {periods.length > 0 ? (
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <Field
                label="Período"
                name="pao"
                className="w-44"
                children={
                  <select
                    name="pao"
                    value={defaultPao ?? ''}
                    onChange={(event) => {
                      setPao(event.target.value)
                      setSelected(new Set())
                    }}
                    className="input"
                  >
                    {periods.map((period) => (
                      <option key={period.pao_period} value={period.pao_period}>
                        {period.pao_period}
                        {period.pao_period === activePao ? ' (activo)' : ''}
                      </option>
                    ))}
                  </select>
                }
              />
              {canManage && (
                <DesktopOnly>
                  <Button size="sm" onClick={() => toggleAll(rows)} variant="secondary">
                    {allSelected ? 'Quitar selección' : 'Seleccionar renovables'}
                  </Button>
                </DesktopOnly>
              )}
            </div>
          ) : (
            <p className="t-caption mb-4">No hay períodos académicos registrados.</p>
          )}

          {canManage && (
            <DesktopOnly>
              <p className="t-caption mb-3">
                {renewable.length === 0 ? (
                  'Toda esta nómina ya está en el período activo.'
                ) : (
                  <>
                    Se renovarán <strong>{selected.size}</strong> {selected.size === 1 ? 'miembro' : 'miembros'} hacia{' '}
                    <strong>{activePao ?? 'el período activo'}</strong>; los congelados se conservan como evidencia del
                    período anterior.
                  </>
                )}
              </p>
            </DesktopOnly>
          )}

          <Table
            columns={columns}
            rows={rows}
            rowKey="id"
            headerExtra={
              canManage ? (
                <DesktopOnly>
                  <Button onClick={renew} disabled={busy || selected.size === 0}>
                    {busy ? 'Renovando…' : `Renovar nómina (${selected.size})`}
                  </Button>
                </DesktopOnly>
              ) : null
            }
            empty={
              <EmptyState
                message="No hay nómina previa para renovar."
                hint="Cuando se cierre un período, su nómina quedará congelada aquí para renovarla."
              />
            }
          />
        </>
      )}
    </>
  )
}

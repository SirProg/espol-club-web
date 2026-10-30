import { useCallback, useState } from 'react'

import { catalogs, clubDocuments, clubs } from '../../lib/api/endpoints'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/auth'
import { PERMISSIONS, UPLOAD_ACCEPT } from '../../lib/enums'
import SectionTitle from '../../components/ui/SectionTitle'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Field from '../../components/ui/Field'
import InfoRow from '../../components/ui/InfoRow'
import ChipList from '../../components/ui/ChipList'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import DesktopOnly from '../../components/ui/DesktopOnly'
import { useToast } from '../../components/ui/toast-context'
import { label } from '../../lib/enums'
import { fmtDate } from '../../lib/format'

/**
 * Información del club (18) — RF-16 (documentos) y edición de datos.
 *
 * Alternar visibilidad de un documento sí se permite desde el móvil (matriz
 * §4); subir PDF y editar los datos se difieren al escritorio.
 */
export default function Informacion() {
  const { ledClubId, can } = useAuth()
  const toast = useToast()

  const clubFetcher = useCallback(() => clubs.detail(ledClubId), [ledClubId])
  const catalogFetcher = useCallback(() => catalogs.all(), [])
  const club = useApi(clubFetcher)
  const catalogsData = useApi(catalogFetcher)

  const canManage = can(PERMISSIONS.MANAGE_CLUB_INFO)
  const canDocuments = can(PERMISSIONS.MANAGE_DOCUMENTS)

  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(null)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [docForm, setDocForm] = useState({ title: '', is_public: false, file: null })
  const [deleting, setDeleting] = useState(null)

  const data = club.data
  const areas = catalogsData.data?.interest_areas ?? []

  function startEdit() {
    setForm({
      description: data?.description ?? '',
      location: data?.location ?? '',
      image: data?.image ?? '',
      interest_area_ids: (data?.interest_areas ?? []).map((area) => area.id),
    })
    setError(null)
    setEditing(true)
  }

  function toggleArea(id) {
    const ids = new Set(form.interest_area_ids)
    if (ids.has(id)) ids.delete(id)
    else ids.add(id)
    setForm({ ...form, interest_area_ids: [...ids] })
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const payload = {
        description: form.description.trim(),
        location: form.location.trim(),
        image: form.image.trim(),
        interest_area_ids: form.interest_area_ids,
      }
      await clubs.update(ledClubId, payload)
      toast.toast('Información actualizada.', 'success')
      setEditing(false)
      club.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function uploadDocument(event) {
    event.preventDefault()
    if (!docForm.file || !docForm.title.trim()) return
    const fd = new FormData()
    fd.append('title', docForm.title.trim())
    fd.append('file', docForm.file)
    fd.append('is_public', String(docForm.is_public))
    setUploading(true)
    try {
      await clubs.uploadDocument(ledClubId, fd)
      toast.toast('Documento subido.', 'success')
      setUploadOpen(false)
      setDocForm({ title: '', is_public: false, file: null })
      club.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setUploading(false)
    }
  }

  async function toggleVisibility(document) {
    try {
      await clubDocuments.setVisibility(document.id, !document.is_public)
      toast.toast('Documento actualizado.', 'success')
      club.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    }
  }

  async function confirmDeleteDocument() {
    setUploading(true)
    try {
      await clubDocuments.remove(deleting.id)
      toast.toast('Documento eliminado.', 'success')
      setDeleting(null)
      club.reload()
    } catch (err) {
      toast.toast(err.message, 'danger')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <SectionTitle
        eyebrow="Gestión del club"
        title="Información"
        description="Datos generales y documentos del club."
      >
        {data && <Badge text={label(data.status)} tone={data.status === 'Active' ? 'success' : 'warning'} />}
      </SectionTitle>

      {club.loading ? (
        <p className="t-caption">Cargando…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Datos generales">
            <dl>
              <InfoRow label="Nombre">{data?.name ?? '—'}</InfoRow>
              <InfoRow label="Sigla" mono>{data?.acronym ?? '—'}</InfoRow>
              <InfoRow label="Descripción">{data?.description ?? '—'}</InfoRow>
              <InfoRow label="Ubicación">{data?.location ?? '—'}</InfoRow>
              <InfoRow label="Facultad">{data?.faculty_name ?? '—'}</InfoRow>
              <InfoRow label="Áreas de interés">
                <ChipList items={(data?.interest_areas ?? []).map((area) => area.name)} tone="primary" />
              </InfoRow>
              <InfoRow label="Líder">
                {data?.leader ? `${data.leader.full_name} (${data.leader.enrollment})` : 'Sin líder asignado'}
              </InfoRow>
              <InfoRow label="Redes">
                {(data?.social_media ?? []).length === 0 ? (
                  '—'
                ) : (
                  <ul className="space-y-0.5">
                    {(data.social_media ?? []).map((social, index) => (
                      <li key={index} className="t-body">
                        <a className="text-primary underline" href={social.link} target="_blank" rel="noreferrer">
                          {social.network}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </InfoRow>
            </dl>
            {canManage && data?.status !== 'Pending Leader' && (
              <DesktopOnly>
                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={startEdit}>
                    Editar información
                  </Button>
                </div>
              </DesktopOnly>
            )}
          </Card>

          <Card
            title="Documentos"
            subtitle="Los documentos públicos los ve cualquier estudiante."
            right={
              canDocuments && data?.status !== 'Pending Leader' ? (
                <DesktopOnly>
                  <Button size="sm" onClick={() => setUploadOpen(true)}>
                    Subir PDF
                  </Button>
                </DesktopOnly>
              ) : null
            }
          >
            {(data?.documents ?? []).length === 0 ? (
              <EmptyState
                message="El club aún no ha subido documentos."
                hint="Estatutos, actas o planes de trabajo en PDF."
                width={36}
              />
            ) : (
              <ul className="divide-y divide-border">
                {(data.documents ?? []).map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="t-body font-medium text-primary underline"
                      >
                        {document.title}
                      </a>
                      <p className="t-caption">{fmtDate(document.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge text={document.is_public ? 'Público' : 'Privado'} tone={document.is_public ? 'success' : 'neutral'} />
                      {canDocuments && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => toggleVisibility(document)}
                            title="Alternar visibilidad"
                          >
                            {document.is_public ? 'Hacer privado' : 'Hacer público'}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleting(document)}>
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar información"
        description="Los campos institucionales (nombre, sigla y facultad) los administra GBP."
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field
            label="Descripción"
            name="description"
            error={error}
            children={
              <textarea
                name="description"
                rows={4}
                value={form?.description ?? ''}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="input min-h-11"
              />
            }
            required
          />
          <Field
            label="Ubicación"
            name="location"
            value={form?.location ?? ''}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
          />
          <Field
            label="Imagen (URL)"
            name="image"
            value={form?.image ?? ''}
            onChange={(event) => setForm({ ...form, image: event.target.value })}
            placeholder="https://…"
          />
          <div>
            <p className="t-label mb-2">Áreas de interés</p>
            {areas.length === 0 ? (
              <p className="t-caption">Cargando…</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => {
                  const active = (form?.interest_area_ids ?? []).includes(area.id)
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => toggleArea(area.id)}
                      aria-pressed={active}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-alt text-ink-muted ring-1 ring-border hover:ring-primary'
                      }`}
                    >
                      {area.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Subir documento"
        description="El servidor solo acepta PDF."
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={uploadDocument} disabled={uploading || !docForm.title.trim() || !docForm.file}>
              {uploading ? 'Subiendo…' : 'Subir'}
            </Button>
          </>
        }
      >
        <form onSubmit={uploadDocument} className="space-y-4" noValidate>
          <Field
            label="Título"
            name="title"
            value={docForm.title}
            onChange={(event) => setDocForm({ ...docForm, title: event.target.value })}
            required
          />
          <Field
            label="Archivo"
            name="file"
            type="file"
            accept={UPLOAD_ACCEPT}
            onChange={(event) => setDocForm({ ...docForm, file: event.target.files?.[0] ?? null })}
            required
          />
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={docForm.is_public}
              onChange={(event) => setDocForm({ ...docForm, is_public: event.target.checked })}
              className="mt-0.5 checkbox"
            />
            <span>
              <span className="font-semibold">Público</span>
              <span className="t-caption block">Lo verá cualquier estudiante desde la app.</span>
            </span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDeleteDocument}
        title="Eliminar documento"
        message={
          deleting
            ? `¿Confirmas eliminar "${deleting.title}"? No se puede recuperar.`
            : ''
        }
        confirmLabel="Eliminar"
        danger
        busy={uploading}
      />
    </>
  )
}

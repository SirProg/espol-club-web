/**
 * Los valores de estado se manejan internamente en inglés, tal como se
 * almacenan, y se traducen al español únicamente en la capa de presentación
 * (RNF-10). Portado de espol-club/src/constants/enums.js y contrastado con
 * MASTER §18.
 */

const LABELS = {
  // Solicitudes de membresía
  Pending: 'Pendiente',
  Approved: 'Aprobada',
  Rejected: 'Rechazada',
  // Membresías
  Active: 'Activa',
  Frozen: 'Congelada',
  Expired: 'Expirada',
  Revoked: 'Revocada',
  // Trámites GBP
  Submitted: 'Enviado',
  'Under Review': 'En revisión',
  // Clubes
  'Pending Leader': 'Sin líder asignado',
  // Eventos
  'In-person': 'Presencial',
  Online: 'En línea',
  Virtual: 'Virtual',
  Public: 'Público',
  MembersOnly: 'Solo miembros',
  // Credencial y asistencia
  Registered: 'Inscrito',
  Attended: 'Asistió',
  NoShow: 'No asistió',
  Used: 'Usada',
  Closed: 'Cerrado',
  // Formularios
  Membership: 'Postulación',
  Event: 'Inscripción a evento',
}

/** Traduce un enum de base de datos a su etiqueta en español. */
export function label(value) {
  return LABELS[value] ?? value ?? '—'
}

/** Tono visual del badge y de la franja según el estado. */
export function statusTone(status) {
  if (['Approved', 'Active', 'Attended', 'Used'].includes(status)) return 'success'
  if (['Rejected', 'Revoked', 'Expired', 'NoShow'].includes(status)) return 'danger'
  return 'warning'
}

export const ROLES = {
  ESTUDIANTE: 'Estudiante Politécnico',
  MIEMBRO: 'Miembro del Club',
  LIDER: 'Líder de Club',
  GBP: 'Administrador GBP',
}

/** Permisos granulares por club (apps/clubs/permissions.py). */
export const PERMISSIONS = {
  ACCESS_WEB_PANEL: 'access_web_panel',
  MANAGE_CLUB_INFO: 'manage_club_info',
  MANAGE_MEMBERS: 'manage_members',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_FORMS: 'manage_forms',
  MANAGE_EVENTS: 'manage_events',
  SCAN_EVENT_QR: 'scan_event_qr',
  MANAGE_DOCUMENTS: 'manage_documents',
  SUBMIT_GBP_REPORTS: 'submit_gbp_reports',
}

export const PERMISSION_LABELS = {
  access_web_panel: 'Acceder al panel web',
  manage_club_info: 'Editar la información del club',
  manage_members: 'Administrar la nómina',
  manage_roles: 'Configurar roles y permisos',
  manage_forms: 'Diseñar formularios',
  manage_events: 'Gestionar eventos',
  scan_event_qr: 'Escanear códigos QR',
  manage_documents: 'Administrar documentos',
  submit_gbp_reports: 'Enviar reportes a GBP',
}

/** Tipos de campo admitidos por los formularios dinámicos (MASTER §7.3). */
export const FIELD_TYPES = [
  { value: 'text', label: 'Texto corto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Lista desplegable' },
  { value: 'radio', label: 'Opción única' },
  { value: 'checkbox', label: 'Casillas' },
]

/** Los tipos que necesitan que el líder defina opciones. */
export const FIELD_TYPES_WITH_OPTIONS = ['select', 'radio', 'checkbox']

export const EVENT_MODES = ['In-person', 'Online', 'Virtual']
export const EVENT_VISIBILITY = ['Public', 'MembersOnly']

/**
 * `document_type` es texto libre en el servidor (CharField 120, sin choices),
 * no un catálogo cerrado. Estas son sugerencias para un datalist, no opciones
 * de un select: el líder puede escribir cualquier otra cosa.
 */
export const DOCUMENT_TYPE_SUGGESTIONS = [
  'Nómina de Miembros',
  'Informe de actividades',
  'Plan de trabajo',
  'Presupuesto',
  'Acta de constitución',
  'Estatutos',
]

/** RNF-08: las cargas son solo PDF, tanto documentos del club como trámites. */
export const UPLOAD_ACCEPT = '.pdf,application/pdf'

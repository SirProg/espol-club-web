/**
 * Superficie del API de ESPOLCLUB, una función por operación.
 *
 * Las pantallas llaman solo a este módulo. Varias rutas del servidor exponen
 * verbos peligrosos por herencia de vistas (`DELETE /events/{id}/staff/` borra
 * el evento entero, no el staff); al declarar aquí únicamente el verbo correcto
 * de cada ruta, esos accidentes quedan fuera del alcance de la interfaz.
 */

import { api } from './client'

/* ────────────────────────────  Autenticación  ──────────────────────────── */

export const auth = {
  /**
   * El campo es `identifier` y acepta matrícula o correo institucional
   * (`api/v1/accounts/authentication.py`); un `@` decide por cuál buscar.
   * Devuelve solo { access, refresh }: el usuario se pide aparte con `me()`.
   */
  login: (identifier, password) =>
    api.post('/auth/login/', { identifier, password }, { auth: false }),

  /** Sesión completa: perfil, rol derivado, club liderado y permisos por club. */
  me: () => api.get('/auth/me/'),

  register: (payload) => api.post('/auth/register/', payload, { auth: false }),
  verify: (token) => api.post('/auth/verify/', { token }, { auth: false }),
  resendVerification: (email) =>
    api.post('/auth/verify/resend/', { email }, { auth: false }),

  requestPasswordReset: (email) =>
    api.post('/auth/password-reset/', { email }, { auth: false }),
  confirmPasswordReset: (payload) =>
    api.post('/auth/password-reset/confirm/', payload, { auth: false }),
}

/* ─────────────────────────────  Catálogos  ─────────────────────────────── */

/** Público, sin sesión: facultades, áreas de interés, períodos PAO y el activo. */
export const catalogs = {
  all: () => api.get('/catalogs/', undefined, { auth: false }),
}

/* ──────────────────────────────  Perfil  ───────────────────────────────── */

export const profile = {
  get: () => api.get('/students/me/'),
  /** Solo admite description, skills y social_media: lo institucional no se edita. */
  update: (payload) => api.patch('/students/me/', payload),

  /** Historial de postulaciones propias (pantalla 15). */
  applications: () => api.get('/students/me/applications/'),

  /**
   * Credenciales QR propias (pantalla 12). Con `usable`, solo las que aún
   * sirven (`qr_status = Active`); sin él, también las usadas y expiradas,
   * que es lo que necesita el historial.
   */
  registrations: ({ usable } = {}) =>
    api.get('/students/me/registrations/', { usable: usable ? 'true' : undefined }),
}

/* ──────────────────────────────  Clubes  ───────────────────────────────── */

export const clubs = {
  /**
   * Catálogo global (pantalla 28). Devuelve SIEMPRE el serializer público,
   * incluso para el líder de un club: la nómina solo llega por `detail()`.
   * Sin paginación en el servidor — llega la tabla completa.
   */
  list: (params) => api.get('/clubs/', params),

  /** Interno o público según si quien pide puede ver la nómina (RN-3). */
  detail: (clubId) => api.get(`/clubs/${clubId}/`),

  /** Alta de club por GBP (pantalla 29). Requiere `leader_enrollment`. */
  create: (payload) => api.post('/clubs/', payload),
  update: (clubId, payload) => api.patch(`/clubs/${clubId}/`, payload),

  members: (clubId, params) => api.get(`/clubs/${clubId}/members/`, params),

  /** Nómina de un PAO concreto, para la pantalla de renovación (26). */
  roster: (clubId, pao) => api.get(`/clubs/${clubId}/nomina/`, { pao }),

  /**
   * Renueva las membresías indicadas al PAO **activo**.
   * El servidor descarta cualquier `pao_period` que se le envíe
   * (`clubs/views.py` fuerza None), por eso no se acepta aquí.
   * Responde { renewed: [...], skipped: [ids] }.
   */
  renewRoster: (clubId, membershipIds) =>
    api.post(`/clubs/${clubId}/nomina/`, { membership_ids: membershipIds }),

  roles: (clubId, params) => api.get(`/clubs/${clubId}/roles/`, params),
  createRole: (clubId, payload) => api.post(`/clubs/${clubId}/roles/`, payload),

  // No hay `documents(clubId)`: `detail()` ya trae `documents[]` filtrado por
  // visibilidad, y pedir la lista aparte sería un viaje de más.

  /** Multipart. RNF-08: el servidor solo acepta PDF (validate_pdf_file). */
  uploadDocument: (clubId, formData) =>
    api.upload(`/clubs/${clubId}/documents/`, formData),

  /** Alta y baja del líder, solo GBP (pantalla 30). */
  assignLeader: (clubId, enrollment) =>
    api.post(`/clubs/${clubId}/leader/assign/`, { enrollment }),
  revokeLeader: (clubId) => api.post(`/clubs/${clubId}/leader/revoke/`, {}),
}

export const clubDocuments = {
  setVisibility: (documentId, isPublic) =>
    api.patch(`/club-documents/${documentId}/`, { is_public: isPublic }),
  remove: (documentId) => api.del(`/club-documents/${documentId}/`),
}

/* ───────────────────────────  Roles y nómina  ──────────────────────────── */

export const roles = {
  update: (roleId, payload) => api.patch(`/roles/${roleId}/`, payload),
  /** Devuelve 204, o 200 con { deactivated: true } si el rol ya tiene miembros. */
  remove: (roleId) => api.del(`/roles/${roleId}/`),
}

export const memberships = {
  changeRole: (membershipId, roleId) =>
    api.patch(`/memberships/${membershipId}/`, { role_id: roleId }),

  /**
   * Baja lógica. `POST /memberships/{id}/` sin `/revoke/` hace lo mismo, pero
   * la ruta explícita es la intencional y la que se lee en los logs.
   */
  revoke: (membershipId) => api.post(`/memberships/${membershipId}/revoke/`, {}),
}

/* ──────────────────────  Formularios dinámicos  ────────────────────────── */

export const forms = {
  list: (clubId, params) => api.get(`/clubs/${clubId}/forms/`, params),

  /**
   * Esquema del formulario de postulación activo del club (pantalla 8).
   * 404 con código `no_membership_form` si el club aún no ha publicado uno.
   */
  membershipForm: (clubId) => api.get(`/clubs/${clubId}/forms/membership/`),
  create: (clubId, payload) => api.post(`/clubs/${clubId}/forms/`, payload),

  detail: (formId) => api.get(`/forms/${formId}/`),
  update: (formId, payload) => api.patch(`/forms/${formId}/`, payload),
  remove: (formId) => api.del(`/forms/${formId}/`),

  /**
   * Un formulario con respuestas no se edita: se versiona (RF-27).
   * `is_editable` en la respuesta de `detail` dice cuál de los dos toca.
   */
  createVersion: (formId, payload) => api.post(`/forms/${formId}/versions/`, payload),

  activate: (formId) => api.post(`/forms/${formId}/activate/`, {}),
  deactivate: (formId) => api.post(`/forms/${formId}/deactivate/`, {}),

  /** Valida respuestas contra el esquema. Responde { valid, responses }. */
  validate: (formId, responses) =>
    api.post(`/forms/${formId}/validate/`, { responses }),
}

/* ────────────────────  Solicitudes de membresía  ───────────────────────── */

export const applications = {
  /** Bandeja del líder (pantalla 21). Filtra por status: Pending/Approved/Rejected. */
  list: (clubId, params) => api.get(`/clubs/${clubId}/applications/`, params),

  /**
   * ¿Puede este estudiante postular a este club? (pantalla 7)
   * Responde `{allowed, reason, code}`; los códigos son `not_found`,
   * `club_not_active`, `already_member`, `already_pending` y `no_membership_form`.
   * Se consulta ANTES de ofrecer el botón, para no mandar a un formulario que
   * el servidor va a rechazar.
   */
  canApply: (clubId) => api.get(`/clubs/${clubId}/applications/can-apply/`),

  /** Envía la postulación (pantalla 8). RN-2 la bloquea si ya hay una Pending. */
  submit: (clubId, responses) =>
    api.post(`/clubs/${clubId}/applications/`, { responses }),

  approve: (applicationId) => api.post(`/applications/${applicationId}/approve/`, {}),

  /** RN-5: el feedback es obligatorio y el servidor lo exige no vacío. */
  reject: (applicationId, feedback) =>
    api.post(`/applications/${applicationId}/reject/`, { feedback }),
}

/* ──────────────────────────────  Eventos  ──────────────────────────────── */

export const events = {
  /**
   * Cartelera para el estudiante (pantalla 9). Filtros: `club`, `upcoming`.
   * Los `MembersOnly` **también** se listan: se ven, pero el registro se
   * bloquea (RF-33). Sin paginación en el servidor: llega todo.
   */
  list: (params) => api.get('/events/', params),

  listByClub: (clubId, params) => api.get(`/clubs/${clubId}/events/`, params),
  create: (clubId, payload) => api.post(`/clubs/${clubId}/events/`, payload),

  /** Trae además `can_register` ({can_register, reason, code}) y `stats`. */
  detail: (eventId) => api.get(`/events/${eventId}/`),

  /** Inscribe y devuelve la credencial con su `qr_token` (pantallas 11 → 12). */
  register: (eventId, responses) =>
    api.post(`/events/${eventId}/register/`, { responses }),
  update: (eventId, payload) => api.patch(`/events/${eventId}/`, payload),
  remove: (eventId) => api.del(`/events/${eventId}/`),

  staff: (eventId) => api.get(`/events/${eventId}/staff/`),

  /**
   * PUT **reemplaza el conjunto completo** de staff: hay que mandar siempre la
   * lista entera, no solo los cambios.
   *
   * No existe `DELETE` de staff en esta interfaz a propósito: la ruta lo acepta
   * por herencia de vista, pero borraría el evento.
   */
  setStaff: (eventId, studentIds) =>
    api.put(`/events/${eventId}/staff/`, { student_ids: studentIds }),

  /** Bitácora (pantalla 34). Responde { event, summary, registrations }. */
  registrations: (eventId, { responses } = {}) =>
    api.get(`/events/${eventId}/registrations/`, {
      responses: responses ? 'true' : undefined,
    }),
}

/* ──────────────────────────────  Asistencia  ───────────────────────────── */

export const attendance = {
  /**
   * Registra la asistencia a partir del token del QR (pantalla 13).
   *
   * Solo el Staff asignado al evento puede escanear, pero eso lo comprueba el
   * servicio, no el permiso de la vista: la respuesta de error trae el código
   * (`not_event_staff`, `qr_already_used`, `unknown_qr_token`,
   * `outside_scan_window`) y con eso se explica el fallo.
   */
  scan: (qrToken) => api.post('/attendance/scan/', { qr_token: qrToken }),
}

/* ────────────────────────────────  GBP  ────────────────────────────────── */

export const gbp = {
  /** Trámites enviados por el club (pantalla 27, lado del líder). */
  clubProcesses: (clubId) => api.get(`/clubs/${clubId}/processes/`),
  /** Multipart: pao_period, document_type y file (PDF). */
  submitProcess: (clubId, formData) =>
    api.upload(`/clubs/${clubId}/processes/`, formData),

  /** Buzón de GBP (pantalla 31). Filtros: status, pao, club. */
  inbox: (params) => api.get('/gbp/processes/', params),
  process: (processId) => api.get(`/gbp/processes/${processId}/`),

  /** Marca el trámite como "En revisión" y lo asigna a quien lo toma. */
  takeProcess: (processId) => api.post(`/gbp/processes/${processId}/take/`, {}),

  /** RN-5: al rechazar, el feedback es obligatorio. */
  reviewProcess: (processId, { approved, feedback }) =>
    api.post(`/gbp/processes/${processId}/review/`, { approved, feedback }),

  exportProcess: (processId, format = 'xlsx') =>
    api.download(`/gbp/processes/${processId}/export/`, {
      params: { format },
      fallbackName: `tramite-${processId}.${format}`,
    }),

  exportInbox: (params) =>
    api.download('/gbp/processes/export/', {
      params: { ...params, format: 'xlsx' },
      fallbackName: 'tramites.xlsx',
    }),

  /** Histórico por PAO (pantalla 33). `pao` es obligatorio. */
  history: (pao) => api.get('/gbp/history/', { pao }),

  paoPeriods: () => api.get('/gbp/pao/'),
  createPao: (payload) => api.post('/gbp/pao/', payload),
  /** La clave primaria es la cadena del período, p. ej. "2026-I". */
  updatePao: (paoPeriod, payload) =>
    api.patch(`/gbp/pao/${encodeURIComponent(paoPeriod)}/`, payload),
}

/* ───────────────────────────  Notificaciones  ──────────────────────────── */

export const notifications = {
  /**
   * Responde { unread_count, results } — envoltorio propio del endpoint, no la
   * paginación de DRF. No usar el cliente de listas genérico con esto.
   */
  list: (params) => api.get('/notifications/', params),

  /** Sin `ids`, marca todas como leídas. Responde { marked, unread_count }. */
  markRead: (ids) => api.post('/notifications/read/', ids ? { ids } : {}),
}

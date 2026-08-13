/**
 * Tabla de navegación del panel — port de espol-club/src/navigation/modules.js.
 *
 * Aquí viven el menú lateral, las rutas y las guardas por rol. El rol viene de
 * `/auth/me/` (derivado en el servidor), nunca del JWT.
 *
 * MASTER §11: Líder → Panel (17) · GBP → Catálogo global (28). Un estudiante
 * no tiene módulos: se le muestra el aviso de "usa la app móvil".
 */

import { PERMISSIONS } from '../lib/enums'

export const ROUTES = {
  LOGIN: '/login',
  REGISTRO: '/registro',
  VERIFICACION: '/verificacion',
  RECUPERACION: '/recuperacion',

  /**
   * Entorno del Estudiante y del Miembro del Club (MASTER §10 B).
   * Mismo código para web y móvil: barra lateral en escritorio, pestañas
   * inferiores bajo 1024px.
   */
  APP: '/app',
  APP_INICIO: '/app',
  APP_CLUBES: '/app/clubes',
  APP_CLUB: '/app/clubes/:clubId',
  APP_POSTULAR: '/app/clubes/:clubId/postular',
  APP_EVENTOS: '/app/eventos',
  APP_EVENTO: '/app/eventos/:eventId',
  APP_CREDENCIALES: '/app/credenciales',
  APP_HISTORIAL: '/app/historial',
  APP_PERFIL: '/app/perfil',
  APP_ESCANER: '/app/escaner',

  LIDER: '/lider',
  LIDER_PANEL: '/lider',
  LIDER_INFO: '/lider/informacion',
  LIDER_MIEMBROS: '/lider/miembros',
  LIDER_ROLES: '/lider/roles',
  LIDER_SOLICITUDES: '/lider/solicitudes',
  LIDER_FORMULARIOS: '/lider/formularios',
  LIDER_EVENTOS: '/lider/eventos',
  LIDER_EVENTO_STAFF: '/lider/eventos/staff/:eventId',
  LIDER_NOMINA: '/lider/nomina',
  LIDER_RENDICION: '/lider/rendicion',
  LIDER_BITACORA: '/lider/bitacora',

  GBP: '/gbp',
  GBP_CATALOGO: '/gbp',
  GBP_ALTA: '/gbp/alta',
  GBP_DETALLE: '/gbp/club/:clubId',
  GBP_BUZON: '/gbp/buzon',
  GBP_PAO: '/gbp/pao',
  GBP_HISTORICO: '/gbp/historico',
}

/**
 * Módulos del Líder. `desktopOnlyActions` resume la matriz de §4 del plan:
 * qué gestión se difiere al escritorio bajo 768px. `permiso` es la clave de
 * `memberships[].permissions` que habilita la gestión, cuando hay una.
 */
export const LIDER_MODULES = [
  {
    path: ROUTES.LIDER_PANEL,
    label: 'Panel',
    section: 'Gestión del club',
    permiso: null,
    end: true,
  },
  {
    path: ROUTES.LIDER_INFO,
    label: 'Información',
    section: 'Gestión del club',
    permiso: PERMISSIONS.MANAGE_CLUB_INFO,
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.LIDER_MIEMBROS,
    label: 'Miembros',
    section: 'Gestión del club',
    permiso: PERMISSIONS.MANAGE_MEMBERS,
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.LIDER_ROLES,
    label: 'Roles',
    section: 'Gestión del club',
    permiso: PERMISSIONS.MANAGE_ROLES,
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.LIDER_SOLICITUDES,
    label: 'Solicitudes',
    section: 'Gestión del club',
    permiso: null,
    // RF-57: el líder aprueba desde el móvil; el rechazo también, con feedback.
    desktopOnlyActions: false,
  },
  {
    path: ROUTES.LIDER_FORMULARIOS,
    label: 'Formularios',
    section: 'Gestión del club',
    permiso: PERMISSIONS.MANAGE_FORMS,
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.LIDER_EVENTOS,
    label: 'Eventos',
    section: 'Gestión del club',
    permiso: PERMISSIONS.MANAGE_EVENTS,
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.LIDER_NOMINA,
    label: 'Nómina PAO',
    section: 'Gestión del club',
    permiso: PERMISSIONS.MANAGE_MEMBERS,
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.LIDER_RENDICION,
    label: 'Rendición',
    section: 'Gestión del club',
    permiso: PERMISSIONS.SUBMIT_GBP_REPORTS,
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.LIDER_BITACORA,
    label: 'Bitácora',
    section: 'Consulta',
    permiso: PERMISSIONS.MANAGE_EVENTS,
    desktopOnlyActions: false,
  },
]

/** Módulos de GBP: todo su panel es exclusivo de escritorio (RF-54). */
export const GBP_MODULES = [
  {
    path: ROUTES.GBP_CATALOGO,
    label: 'Catálogo',
    section: 'Institución',
    end: true,
  },
  {
    path: ROUTES.GBP_ALTA,
    label: 'Alta de club',
    section: 'Institución',
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.GBP_BUZON,
    label: 'Buzón de trámites',
    section: 'Institución',
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.GBP_PAO,
    label: 'Configuración de PAO',
    section: 'Institución',
    desktopOnlyActions: true,
  },
  {
    path: ROUTES.GBP_HISTORICO,
    label: 'Histórico',
    section: 'Institución',
    desktopOnlyActions: true,
  },
]

/**
 * Módulos del Estudiante y del Miembro (MASTER §11, "Menú principal por
 * entorno": Clubes · Eventos · Mi credencial QR · Perfil · Historial).
 *
 * `tab` marca los que llevan pestaña propia bajo 1024px; el resto se alcanza
 * desde Inicio y desde el perfil. Cinco pestañas caben sin apretar; siete no.
 *
 * El Escáner es del Miembro que además es Staff de un evento. No se puede
 * saber por adelantado —el staff se asigna por evento, no por club— así que se
 * ofrece a todo miembro y el servidor responde `not_event_staff` si no le toca.
 */
export const ESTUDIANTE_MODULES = [
  { path: ROUTES.APP_INICIO, label: 'Inicio', section: 'Mi espacio', end: true, tab: 'inicio' },
  { path: ROUTES.APP_CLUBES, label: 'Clubes', section: 'Mi espacio', tab: 'clubes' },
  { path: ROUTES.APP_EVENTOS, label: 'Eventos', section: 'Mi espacio', tab: 'eventos' },
  {
    path: ROUTES.APP_CREDENCIALES,
    label: 'Mi credencial QR',
    // La pestaña necesita una etiqueta corta o se parte en dos líneas.
    tabLabel: 'Credencial',
    section: 'Mi espacio',
    tab: 'credencial',
  },
  { path: ROUTES.APP_HISTORIAL, label: 'Historial', section: 'Mi cuenta' },
  { path: ROUTES.APP_PERFIL, label: 'Perfil', section: 'Mi cuenta', tab: 'perfil' },
  { path: ROUTES.APP_ESCANER, label: 'Escáner QR (Staff)', section: 'Mi cuenta', soloMiembro: true },
]

/** Los módulos visibles para un rol: el Escáner es solo para miembros. */
export function estudianteModules(appRole) {
  const esMiembro = appRole === 'Club Member' || appRole === 'Club Leader'
  return ESTUDIANTE_MODULES.filter((module) => !module.soloMiembro || esMiembro)
}

export const ROLE_LABELS = {
  'GBP Admin': 'Administrador GBP',
  'Club Leader': 'Líder de Club',
  'Club Member': 'Miembro del Club',
  Student: 'Estudiante Politécnico',
}

/**
 * Destino de cada rol tras iniciar sesión (MASTER §11).
 *
 * Los cuatro roles deben estar aquí. Si alguno faltara, el enrutador lo mandaría
 * a "/login", donde la guarda de sesión volvería a mandarlo a su hogar: un
 * rebote infinito. El estudiante y el miembro tienen hogar propio en la web
 * precisamente para que ese hueco no exista.
 */
export const ROLE_HOME = {
  'Club Leader': ROUTES.LIDER_PANEL,
  'GBP Admin': ROUTES.GBP_CATALOGO,
  'Club Member': ROUTES.APP_INICIO,
  Student: ROUTES.APP_INICIO,
}

/** Hogar de una sesión, con respaldo para un rol que el servidor añada luego. */
export function homeFor(appRole) {
  return ROLE_HOME[appRole] ?? ROUTES.APP_INICIO
}

export const ROUTE_ROLE = {
  [ROUTES.LIDER_PANEL]: 'Club Leader',
  [ROUTES.LIDER_INFO]: 'Club Leader',
  [ROUTES.LIDER_MIEMBROS]: 'Club Leader',
  [ROUTES.LIDER_ROLES]: 'Club Leader',
  [ROUTES.LIDER_SOLICITUDES]: 'Club Leader',
  [ROUTES.LIDER_FORMULARIOS]: 'Club Leader',
  [ROUTES.LIDER_EVENTOS]: 'Club Leader',
  [ROUTES.LIDER_NOMINA]: 'Club Leader',
  [ROUTES.LIDER_RENDICION]: 'Club Leader',
  [ROUTES.LIDER_BITACORA]: 'Club Leader',
  [ROUTES.GBP_CATALOGO]: 'GBP Admin',
  [ROUTES.GBP_ALTA]: 'GBP Admin',
  [ROUTES.GBP_DETALLE]: 'GBP Admin',
  [ROUTES.GBP_BUZON]: 'GBP Admin',
  [ROUTES.GBP_PAO]: 'GBP Admin',
  [ROUTES.GBP_HISTORICO]: 'GBP Admin',
}

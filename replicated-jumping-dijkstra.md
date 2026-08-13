# ESPOLCLUB — Panel web (Líder + GBP)

## Context

El backend Django REST de ESPOLCLUB ya está construido y desplegable (`/home/kvn/Documentos/down/P2/espol_club`, base `/api/v1/`). La app Expo (`/home/kvn/Documentos/down/P2/espol-club`) ya define el **sistema visual completo** del proyecto en `src/theme/theme.js`, pero opera contra SQLite local y no tiene cliente HTTP. El repo `espol-club-web` es hoy la plantilla Vite + React 19 sin tocar.

Este plan construye el **entorno web** que falta: los paneles del Líder y de GBP (MASTER §10 C/D, §11), consumiendo el API real, con el sistema visual ESPOL portado a la web, tema claro/oscuro/sistema, y responsive — para publicarse como sitio estático en InfinityFree.

**Decisiones tomadas por el usuario en esta sesión:**
1. Alcance: **solo paneles Líder + GBP** + auth compartida. El estudiante permanece en la app móvil.
2. Móvil (<768px): **consulta sí; gestión limitada** a las acciones que ese rol razonablemente haría desde el teléfono (matriz en §4).
3. Sin color por club: **todo en azul ESPOL** `#001A43`.
4. Estilos: **Tailwind v4** con los tokens ESPOL en `@theme`.

**Restricción de diseño (RNF-07):** el panel web debe ser **plano** — tablas, formularios y botones. Sin dashboards analíticos, sin gráficos, sin animaciones avanzadas. Sin librería de charts.

---

## 1. Sistema visual — puerto fiel de `theme.js`

Fuente de verdad: `/home/kvn/Documentos/down/P2/espol-club/src/theme/theme.js`. **No inventar tokens; copiar los hex exactos.**

**Color.** Azul PANTONE 275 C `#001A43` (única identidad institucional) · escala Cool Gray 11 C `#EDEEF1 → #282C36` (único secundario) · rojo `#C8102E` como acento de énfasis **usado con moderación** · ámbar `#B8791B` para destacados. Semánticos success `#0F7A4A` / warning `#9A6206` / danger `#B32218`, con sus variantes `*Soft` y todo el par claro/oscuro ya tabulado en `theme.js`.

**Tipografía — tres voces, la regla que da carácter al panel:**
- **Spectral** (serif) — solo títulos y el wordmark.
- **IBM Plex Sans** — toda la UI de trabajo.
- **IBM Plex Mono** — **todo dato que es un registro**: matrículas, períodos PAO, tokens QR, fechas de auditoría, IDs. Esta regla es lo que hace legible una tabla administrativa de un vistazo y ya es doctrina del proyecto.

Se autoalojan con `@fontsource/spectral`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` (nada de CDN de Google: InfinityFree debe servir todo).

**Elementos de firma (los tres, y nada más):**
- **Banderín en chevrón** (`Pennant`, port de `src/components/Pennant.js`) — SVG `viewBox="0 0 100 130"`, path `M0 0 H100 V130 L50 101.4 L0 130 Z`, ratio `alto = ancho × 1.3`. Wordmark del sidebar y marca de los estados vacíos.
- **Franja vertical de 4px** en tarjetas y filas. Como ya no hay color por club, **la franja pasa a codificar estado** (`statusTone`: success / warning / danger / neutral). Deja de ser decoración y se vuelve canal de información.
- **Eyebrow** de cada pantalla: rectángulo sólido `14×3px` en `#C8102E` + etiqueta en versalitas 10px `letter-spacing: 1.1px`, nombrando la sección del menú. Es el único uso frecuente del rojo.

**Escalas:** `spacing {4,8,12,16,24,32}`, `radius {sm:6, md:10, lg:14, pill:999}`. **Los badges son cuadrados (6px), no píldoras.** Sombra: claro `0 3px 10px rgba(10,27,61,.06)`, oscuro `0 3px 10px rgba(0,0,0,.4)`.

**Tema.** Tres modos igual que la app: `system | light | dark`, clave `localStorage['theme_mode']` (misma clave que la app Expo). `system` por defecto vía `matchMedia('(prefers-color-scheme: dark)')` **con listener vivo**. Anti-FOUC: script inline en `index.html` que fija `data-theme` en `<html>` antes del primer pintado (equivalente al `theme-init.js` de la Fase 1, MASTER §15.3).

En Tailwind v4: tokens como custom properties dentro de `@theme` en `src/styles/tokens.css`; el par claro/oscuro se resuelve redefiniendo las variables bajo `:root`, `@media (prefers-color-scheme: dark)` guardado con `:root:not([data-theme="light"])`, y `:root[data-theme="dark"]`. Variante custom `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`.

---

## 2. Arquitectura

```
src/
  styles/tokens.css        · @theme + paletas claro/oscuro
  styles/index.css         · @import tailwind, fuentes, base
  lib/api/client.js        · fetch, Bearer, refresh en 401, envelope de error
  lib/api/endpoints.js     · una función por endpoint del API
  lib/api/session.js       · access/refresh en localStorage
  lib/enums.js             · LABELS EN→ES (MASTER §18), label(), statusTone()
  lib/format.js            · fmtDate/fmtDateTime es-EC, esc()
  context/ThemeContext.jsx · system|light|dark
  context/AuthContext.jsx  · sesión de /auth/me/, login, logout, can()
  hooks/useApi.js          · loading / error / vacío
  hooks/useIsDesktop.js    · matchMedia 768px y 1024px
  routing/modules.js       · tabla de navegación + roles (port de la app Expo)
  components/layout/       · AppShell, Sidebar, TopBar, Screen, NotificationBell
  components/ui/           · Pennant, Card, Badge, Button, Field, Table, Modal,
                             EmptyState, InfoRow, SectionTitle, ChipList,
                             ThemeSwitch, ConfirmDialog, DesktopOnly, Toast
  components/forms/        · DynamicForm (render+validación), FormBuilder
  routes/auth/             · Login, Registro, Verificacion, Recuperacion
  routes/lider/            · 11 pantallas
  routes/gbp/              · 6 pantallas
public/.htaccess           · rewrite SPA para Apache/InfinityFree
```

Dependencias a añadir: `react-router-dom`, `tailwindcss` + `@tailwindcss/vite`, los tres `@fontsource/*`. Nada más — sin librería de UI ni de charts (RNF-07).

**`routing/modules.js`** es la tabla que gobierna sidebar, rutas y guardas, portada de `/home/kvn/Documentos/down/P2/espol-club/src/navigation/modules.js`. Cada entrada: `{ path, label, section, roles, desktopOnlyActions }`. Menús exactos de MASTER §11:
- **Líder:** Panel · Información · Miembros · Roles · Solicitudes · Formularios · Eventos · Nómina PAO · Rendición · Bitácora
- **GBP:** Catálogo · Alta de club · Buzón de trámites · Configuración de PAO · Histórico

Notificaciones (pantalla 5) **no tiene página**: es la campana desplegable del `TopBar`, presente en ambos entornos (MASTER §10 A).

**Autorización en cliente.** `GET /auth/me/` devuelve `app_role`, `is_gbp_admin`, `led_club_id` y `memberships[].permissions` (lista de claves concedidas por club). `AuthContext` expone `can(permission, clubId)` que lee de ahí. **Nunca leer el rol del JWT** — `api/v1/accounts/authentication.py:50-53` advierte que ese claim se vuelve obsoleto. La guarda de cliente es presentación; el API es quien autoriza de verdad.

---

## 3. Cliente de API — trampas reales a codificar

Base: `VITE_API_BASE` → `https://espol-club.alwaysdata.net/api/v1` en producción, `http://localhost:8000/api/v1` en dev.

- **Login usa `identifier`**, no `username` ni `enrollment`: `POST /auth/login/ {identifier, password}` → `{access, refresh}`. No devuelve usuario; encadenar `GET /auth/me/`.
- **El refresh rota** (`ROTATE_REFRESH_TOKENS: True`): hay que **persistir el nuevo `refresh`** en cada renovación o la sesión muere a los 7 días. Access dura 30 min → interceptor de 401 con *single-flight* (una sola renovación concurrente, las demás peticiones encoladas).
- **No existe endpoint de logout** y no hay blacklist. `logout()` = borrar tokens locales y redirigir.
- **No hay paginación real.** Toda la config (`PAGE_SIZE`, filtros, `ordering`) es código muerto: ningún endpoint usa genéricos, todos devuelven **arrays planos sin envolver**. `?page`, `?search`, `?ordering` no hacen nada. → **Filtrado, orden y paginado son del cliente**, sobre la lista completa. `GET /clubs/` y `GET /events/` traen la tabla entera.
- **`GET /notifications/` devuelve `{unread_count, results}`** — envoltorio artesanal, no paginación DRF. No usar el cliente de listas genérico.
- **Rutas heredadas destructivas — no invocarlas jamás:** `DELETE /events/{id}/staff/`, `DELETE /events/{id}/registrations/`, `DELETE /forms/{id}/validate/` y `DELETE /forms/{id}/versions/` **borran el recurso padre** (herencia de vista sin override). El cliente solo expondrá los verbos correctos por endpoint.
- **Revocar membresía:** usar siempre `POST /memberships/{id}/revoke/`. `POST /memberships/{id}/` a secas hace lo mismo, pero la ruta explícita es la intencional.
- **`POST /clubs/{id}/nomina/` ignora el `pao_period` enviado** (`clubs/views.py:203` fuerza `None` → PAO activo). No ofrecer selector de PAO destino en la renovación; mostrar el PAO activo como destino fijo.
- **`Club.image` y `Event.marketing_image` son `CharField` de URL**, no subidas. La UI pide una URL, no un file input. Los únicos multipart reales son `POST /clubs/{id}/documents/` y `POST /clubs/{id}/processes/`.
- **`GET /clubs/` siempre devuelve el serializer público**, incluso para el líder. La nómina y el bloque de líder solo llegan por `GET /clubs/{id}/`.
- **No hay endpoint de búsqueda de usuarios.** Los candidatos a Staff salen de `GET /clubs/{id}/members/` (campo `student_id`); `PUT /events/{id}/staff/` **reemplaza el conjunto completo** — la UI debe enviar siempre la lista entera.
- **Club en `Pending Leader` ⇒ panel completo en solo lectura**: `has_club_permission` devuelve `False` para todo (`apps/clubs/policies.py`). La pantalla 17 debe mostrar el aviso de V-12 en vez de dejar botones que fallarán con 403.
- **Errores uniformes:** `{"error": {code, message, field?, errors?}}` (`core/api/exception_handler.py`). Un solo parser traduce `code` a mensaje en español y mapea `field`/`errors` a los campos del formulario. Los éxitos **no** vienen envueltos.
- Throttling a respetar en la UI: login 10/min, registro y reset 5/hora.

**Catálogos:** `GET /catalogs/` (público, sin auth) da facultades, áreas de interés, períodos PAO y `active_pao`. Cargar una vez y cachear en contexto.

---

## 4. Responsive — la matriz que el MASTER no define

MASTER §8 fija la **política** (RF-53 formularios/miembros/roles/GBP solo web · RF-54 GBP solo web · RF-57 el Líder aprueba solicitudes desde móvil) pero **nunca describe el comportamiento a 375px**. Esto lo define este plan.

Breakpoints: **móvil <768 · tablet 768–1023 · escritorio ≥1024**. La restricción aplica **solo bajo 768px**; tablet se comporta como escritorio con tablas condensadas.

Bajo 768px las tablas se rinden como listas de `Card` con la franja de estado a la izquierda y el `Badge` a la derecha — mismo patrón que la app Expo, que no tiene componente Table.

| Módulo | Consulta móvil | Gestión móvil |
| :-- | :-- | :-- |
| 17 Panel del club | ✅ | — |
| 18 Información | ✅ | Alternar visibilidad de documento ✅ · editar datos y subir PDF → escritorio |
| 19 Miembros | ✅ | Cambiar rol ✅ · dar de baja ✅ (con confirmación) |
| 20 Roles y permisos | ✅ | → escritorio (RF-53; la matriz de permisos es una grilla) |
| 21 Solicitudes | ✅ | **Aprobar / rechazar ✅ (RF-57)** |
| 22 Formularios | ✅ | → escritorio (RF-53; el constructor es composición larga) |
| 23·24 Eventos | ✅ | → escritorio (formulario extenso con fechas y cupos) |
| 25 Staff | ✅ | Asignar / retirar ✅ (lista de selección) |
| 26 Nómina PAO | ✅ | → escritorio (RF-53; selección masiva sobre tabla) |
| 27 Rendición GBP | ✅ | → escritorio (RF-53, carga de PDF) |
| 34 Bitácora | ✅ | — (solo consulta) |
| 28–33 **todo GBP** | ✅ | → escritorio, **sin excepciones** (RF-54) |

Mecanismo: un único componente `<DesktopOnly>` que en móvil sustituye el control por un aviso discreto — *"Disponible en escritorio"* — nunca un botón muerto ni un callejón sin salida. Es una regla de **presentación**; la autorización real vive en el API.

**Piso de calidad:** foco de teclado visible, `prefers-reduced-motion` respetado, objetivos táctiles ≥44px, todas las tablas con `overflow-x:auto` propio para que el `body` nunca haga scroll horizontal.

---

## 5. Pantallas → endpoints

**Auth (1–4)** · `POST /auth/login/` · `POST /auth/register/` (facultad por **código**, no id) · `POST /auth/verify/` y `/resend/` · `POST /auth/password-reset/` y `/confirm/`.
**Notificaciones (5)** · `GET /notifications/?unread=true` · `POST /notifications/read/ {ids?}` (sin `ids` marca todas).

**Panel del Líder** — `led_club_id` sale de `/auth/me/`:

| # | Pantalla | Endpoints |
| :-- | :-- | :-- |
| 17 | Panel | `GET /clubs/{id}/` |
| 18 | Información | `PATCH /clubs/{id}/` · `GET·POST /clubs/{id}/documents/` · `PATCH·DELETE /club-documents/{id}/` |
| 19 | Miembros | `GET /clubs/{id}/members/?all=&pao=` · `PATCH /memberships/{id}/` · `POST /memberships/{id}/revoke/` |
| 20 | Roles | `GET·POST /clubs/{id}/roles/?all=` · `PATCH·DELETE /roles/{id}/` |
| 21 | Solicitudes | `GET /clubs/{id}/applications/?status=Pending` · `POST /applications/{id}/approve\|reject/` |
| 22 | Formularios | `GET·POST /clubs/{id}/forms/` · `GET·PATCH /forms/{id}/` · `POST /forms/{id}/versions/` · `/activate/` · `/deactivate/` · `/validate/` |
| 23·24 | Eventos | `GET·POST /clubs/{id}/events/` · `GET·PATCH /events/{id}/` |
| 25 | Staff | `GET·PUT /events/{id}/staff/` · candidatos de `GET /clubs/{id}/members/` |
| 26 | Nómina PAO | `GET /clubs/{id}/nomina/?pao=` · `POST /clubs/{id}/nomina/ {membership_ids}` |
| 27 | Rendición | `GET·POST /clubs/{id}/processes/` (multipart) |
| 34 | Bitácora | `GET /clubs/{id}/events/` + `GET /events/{id}/registrations/?responses=true` |

> Pantalla 34: MASTER §20 registra como deuda que hoy toma siempre `clubEvent[0]`. **Se corrige aquí**: selector de evento + estado vacío. PPD-04 sigue abierta (¿bitácora de un evento o log de auditoría?); se implementa como *inscritos por evento*, que es lo que el API soporta (`registrations` con `summary` de registered/attended/no_show/pending).

**Panel de GBP:**

| # | Pantalla | Endpoints |
| :-- | :-- | :-- |
| 28 | Catálogo global | `GET /clubs/?q=&faculty=&area=` |
| 29 | Alta de club | `POST /clubs/` (incluye `leader_enrollment`) |
| 30 | Detalle club | `GET /clubs/{id}/` · `POST /clubs/{id}/leader/assign\|revoke/` |
| 31 | Buzón de trámites | `GET /gbp/processes/?status=&pao=&club=` · `GET /gbp/processes/{id}/` · `POST .../take\|review/` · `GET .../export/?format=xlsx\|pdf` · `GET /gbp/processes/export/?format=xlsx` |
| 32 | Configuración PAO | `GET·POST /gbp/pao/` · `PATCH /gbp/pao/{pao_period}/` |
| 33 | Histórico | `GET /gbp/history/?pao=` (**`pao` obligatorio**, si falta → 400 `missing_pao`) |

**Formularios dinámicos.** Un `DynamicForm` renderiza los 7 tipos de campo (`text, textarea, number, date, select, radio, checkbox`) desde `fields[]`, y `FormBuilder` los compone. Validar en cliente **y** apoyarse en `POST /forms/{id}/validate/` como red del servidor. Un formulario con respuestas no se edita: se versiona (`is_editable` viene en `FormSerializer`).

**Estados vacíos.** MASTER §13 los declara parte intencional del diseño y da el texto exacto de cada uno (V-12 a V-25). Se usan literalmente; ninguna vista queda en blanco.

**Enumeraciones.** BD en inglés, presentación en español (RNF-10). `LABELS` y `statusTone()` se portan de `/home/kvn/Documentos/down/P2/espol-club/src/constants/enums.js`, contrastados con MASTER §18.

---

## 6. Despliegue en InfinityFree

InfinityFree sirve **estáticos sobre Apache**; no ejecuta Node. `npm run build` → subir `dist/` por FTP a `htdocs/`.

1. **`public/.htaccess`** con rewrite SPA — sin esto, recargar `/lider/miembros` da 404:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
2. **CORS en Django.** `CORS_ALLOWED_ORIGINS` hoy vale por defecto `http://localhost:5500,http://127.0.0.1:5500` — **ni el `:5173` de Vite ni el dominio de InfinityFree están**. Hay que añadir ambos al `.env` del backend o el navegador bloqueará todo.
3. **`FRONTEND_BASE_URL`** (`config/settings/base.py:272`, hoy `http://localhost:5500`) debe apuntar al dominio de InfinityFree, o los enlaces de verificación de correo y de reseteo de contraseña llegarán rotos.
4. **HTTPS obligatorio.** El API fuerza SSL (`SECURE_SSL_REDIRECT`). Si el sitio se sirve por `http://`, el navegador bloqueará las llamadas como *mixed content*. Activar el SSL gratuito de InfinityFree antes de publicar.
5. `DJANGO_ALLOWED_HOSTS` en producción **no tiene default** — vacío rechaza todo.
6. `vite.config.js`: `base: '/'` y `build.assetsInlineLimit` bajo; el plan mantiene React Compiler ya configurado.

---

## 7. Orden de construcción

1. **Base** — Tailwind v4 + tokens ESPOL + fuentes + anti-FOUC · `ThemeContext` + `ThemeSwitch` · cliente de API con refresh · `AuthContext` · router y guardas por rol · `AppShell` (Sidebar + TopBar + campana) · kit `ui/`. Se elimina todo el boilerplate de Vite (`App.css`, `assets/`, `icons.svg`, el `--accent: #aa3bff` de `index.css`).
2. **Auth** — pantallas 1–4 y el enrutamiento por rol de MASTER §11 (Líder → 17, GBP → 28).
3. **Panel del Líder** — 17, 19, 21 primero (el núcleo), luego 18, 20, 22, 23–25, 26, 27, 34.
4. **Panel de GBP** — 28, 30, 31 primero, luego 29, 32, 33.
5. **Despliegue** — `.htaccess`, variables de entorno, CORS, build y subida.

---

## 8. Verificación

**Local, extremo a extremo** con los datos semilla de MASTER §17:

```bash
cd /home/kvn/Documentos/down/P2/espol_club && python manage.py runserver   # :8000
cd /home/kvn/Documentos/down/P2/espol-club-web && npm run dev              # :5173
```
Antes: añadir `http://localhost:5173` a `CORS_ALLOWED_ORIGINS` en el `.env` del backend.

Cuentas semilla (§17.1): Líder `201899001` / `lider123` (Presidente de KOKOA, club 2) · GBP `GBP-001` / `gbp123`.

Recorridos a comprobar:
- **Enrutamiento por rol** — el líder aterriza en 17, GBP en 28; un estudiante (`202311346`) recibe un aviso de "usa la app móvil" en vez de un panel vacío.
- **Ciclo de solicitud** — la solicitud `Pending` de Lucía Torres (§17.7) se aprueba desde 21 y genera la membresía con rol Miembro y las fechas del PAO 2026-I.
- **RN-5** — rechazar sin feedback debe fallar y el error del servidor (`{error:{field}}`) debe aterrizar en el campo correcto del formulario.
- **Solo lectura por `Pending Leader`** — abrir el club 4 (Mecatrónica) desde GBP: debe mostrar el aviso de V-12, no botones que devuelvan 403.
- **Versionado de formularios** — editar un formulario con respuestas debe versionar, no sobrescribir (`is_editable: false`).
- **Renovación de nómina** — 26 sobre el PAO cerrado 2025-II y la membresía `Frozen` 1999; verificar la respuesta `{renewed, skipped}`.
- **Sesión** — forzar la expiración del access (30 min) y confirmar que el refresh rota, se persiste el nuevo y ninguna petición se pierde.

**Tema y responsive** — con `agent-browser`, capturar cada pantalla a 375 / 768 / 1440px en claro y oscuro, y con el SO en modo oscuro sin preferencia guardada. Comprobar: cero scroll horizontal del `body`, la matriz de §4 respetada, foco de teclado visible en toda la navegación, y sin destello de tema al recargar.

**Producción** — tras subir a InfinityFree: recargar una ruta profunda (verifica `.htaccess`), iniciar sesión (verifica CORS + HTTPS) y solicitar un reseteo de contraseña (verifica `FRONTEND_BASE_URL`).

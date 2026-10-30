# ESPOLCLUB — Web

Cliente web de ESPOLCLUB, con los tres entornos que define MASTER §10:

- **Estudiante y Miembro** (`/app`) — catálogo de clubes, postulaciones, eventos,
  credencial QR, historial y perfil. Un solo código para escritorio y teléfono:
  barra lateral desde 1024px, pestañas inferiores por debajo.
- **Panel del Líder** (`/lider`) — información del club, miembros, roles,
  solicitudes, formularios, eventos, nómina PAO, rendición y bitácora.
- **Panel de GBP** (`/gbp`) — catálogo global, alta de clubes, buzón de trámites,
  períodos PAO e histórico.

Consume el API REST de Django documentado en [`MASTER.md`](./MASTER.md).

React 19 · Vite · Tailwind v4 · React Router · `qrcode.react` para las
credenciales. Sin librerías de UI ni de gráficas: RNF-07 exige que los paneles
de gestión sean planos — tablas, formularios y botones.

---

## Puesta en marcha

```bash
npm install
npm run dev          # http://localhost:5173
```

En paralelo, el backend:

```bash
cd ../espol_club
.venv/bin/python manage.py runserver     # http://localhost:8000
```

`vite.config.js` reenvía `/api` a `localhost:8000`, así que en desarrollo el
navegador ve un solo origen y **CORS no interviene**. No hace falta tocar el
`.env` de Django para trabajar en local.

| Comando | Qué hace |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` para revisarlo antes de subir |
| `npm run lint` | ESLint |

## Cuentas de prueba

Sembradas por `python manage.py seed_espol_data` en el backend: unos 120 estudiantes y
40 clubes reales de la ESPOL.

| Rol | Matrícula | Contraseña | Notas |
| :--- | :--- | :--- | :--- |
| Líder de Club | `202490000` | `espolclub2026` | Camila Macías Bustamante, Presidenta de KOKOA |
| Administrador GBP | `GBP-001` | `gbp123` | Ana Rivas |
| Miembro del Club | `202490082` | `espolclub2026` | Andrés Andrade Torres, en KOKOA e IIE; ve nómina y escáner |
| Estudiante | `202311346` | `estudiante123` | Kevin Maldonado, sin club: ve solo la parte pública |

La contraseña general del seed es `espolclub2026` (`core/espol_data.py`); las
cuentas de GBP se provisionan aparte y llevan la suya.

No hay auto-registro para GBP (PPD-02). Para crear otra cuenta:

```bash
cd ../espol_club
.venv/bin/python manage.py provision_gbp_admin GBP-002 \
  --email otro@espol.edu.ec --first-name Nombre --last-name Apellido \
  --password una-contrasena
```

El club **ACP** queda en `Pending Leader`: sirve para revisar el modo de solo
lectura del panel (V-12).

## Estructura

```
src/
  styles/      tokens.css (paleta ESPOL, claro/oscuro) · index.css (tipografía, .input)
  lib/api/     client.js (fetch, refresh rotatorio) · endpoints.js (una función por operación)
  lib/         enums.js (traducción EN→ES) · format.js (fechas es-EC)
  context/     ThemeContext (system|light|dark) · AuthContext (sesión y permisos)
  routing/     modules.js (menú, rutas, hogar por rol) · guards.jsx
  components/  layout/ (AppShell, Sidebar, TopBar, TabBar) · ui/ (kit) · forms/ (DynamicForm)
  routes/      auth/ · estudiante/ (10 pantallas) · lider/ (12) · gbp/ (6)
```

`lib/api/endpoints.js` es el **único** punto de acceso a datos: ninguna pantalla
hace `fetch` por su cuenta. Declara solo el verbo correcto de cada ruta a
propósito — varias rutas del API aceptan verbos peligrosos por herencia de
vistas (`DELETE /events/{id}/staff/` borra el evento entero), y no exponerlos
los deja fuera del alcance de la interfaz.

## Sistema visual

Portado de `espol-club/src/theme/theme.js`, para que la web y la app móvil se
vean como el mismo producto. Los hex no se inventan aquí.

- **Azul PANTONE 275 C `#001A43`** — única identidad institucional.
- **Escala Cool Gray 11 C** — único secundario.
- **Rojo `#C8102E`** — acento de énfasis, usado con moderación.
- **Spectral** para títulos · **IBM Plex Sans** para la UI · **IBM Plex Mono**
  para los datos que son registros: matrículas, PAO, tokens, fechas de auditoría.

Tema claro/oscuro/sistema con la clave `localStorage['theme_mode']`, la misma
que la app. El tema resuelto se fija en `<html data-theme>` antes del primer
pintado con el script de `index.html`, para que no haya destello al recargar.

## Responsive

Móvil `<768` · tablet `768–1023` · escritorio `≥1024`.

**Entorno del estudiante:** funciona entero en cualquier tamaño. No hay
pantallas distintas por dispositivo, solo una distribución que se adapta —
barra lateral desde 1024px, pestañas inferiores por debajo. Todo lo que hace un
estudiante son decisiones sueltas que van igual de bien en un teléfono.

**Paneles de gestión:** bajo 768px las tablas se rinden como tarjetas y **la
gestión pesada se difiere** con `DesktopOnly`: formularios, roles y permisos,
creación de eventos, renovación de nómina, rendición a GBP y todo el panel de
GBP (RF-53, RF-54). Sí operan en móvil: aprobar y rechazar solicitudes (RF-57),
cambiar el rol de un miembro, darlo de baja y asignar Staff.

Es una regla de presentación; quien autoriza de verdad es el API.

---

## Despliegue en InfinityFree

```bash
npm run build      # genera dist/
```

Sube el contenido de `dist/` por FTP a `htdocs/`. `public/.htaccess` ya viaja en
el build y contiene el rewrite que necesita una SPA: sin él, recargar
`/lider/miembros` devolvería 404.

**Activa el SSL gratuito antes de publicar.** El API fuerza HTTPS, así que un
sitio servido por `http://` verá todas sus llamadas bloqueadas como contenido
mixto.

### Dominio

El web se publica en **`https://clubes-espol.42web.io`**. El backend tiene que
conocerlo en estos tres sitios de su `.env` (`~/www/espol_club_api/.env` en
AlwaysData):

```ini
# Sin esto el navegador bloquea todas las peticiones del panel.
CORS_ALLOWED_ORIGINS=https://clubes-espol.42web.io

# Sin esto los correos de verificación y de recuperación llevan enlaces rotos:
# por defecto apunta a http://localhost:5500.
FRONTEND_BASE_URL=https://clubes-espol.42web.io

# En producción no tiene valor por defecto, y vacío rechaza todas las peticiones.
DJANGO_ALLOWED_HOSTS=espol-club.alwaysdata.net
```

Tras cambiarlo, reinicia el sitio desde el panel de AlwaysData.

En el **frontend** solo hay una variable, ya configurada en `.env.production`:
`VITE_API_BASE=https://espol-club.alwaysdata.net/api/v1`. Cámbiala solo si el
API se muda de host.

InfinityFree antepone a cada visita una comprobación anti-bots (un script que
fija la cookie `__test`). Un navegador la pasa sin que se note, pero `curl` y
los monitores de disponibilidad ven esa página en vez del sitio.

### Comprobación tras subir

1. Recarga una ruta profunda como `/lider/miembros` — valida el `.htaccess`.
2. Inicia sesión — valida CORS y HTTPS.
3. Pide una recuperación de contraseña y abre el enlace del correo — valida
   `FRONTEND_BASE_URL`.

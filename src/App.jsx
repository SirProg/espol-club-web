import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { RequireAuth, RequireRole, PublicOnly } from './routing/guards'
import { ROUTES, homeFor } from './routing/modules'
import { useAuth } from './context/auth'

const LoginPage = lazy(() => import('./routes/auth/LoginPage'))
const RegistroPage = lazy(() => import('./routes/auth/RegistroPage'))
const VerificacionPage = lazy(() => import('./routes/auth/VerificacionPage'))
const RecuperacionPage = lazy(() => import('./routes/auth/RecuperacionPage'))
const EstudianteShell = lazy(() => import('./routes/estudiante/EstudianteShell'))
const Inicio = lazy(() => import('./routes/estudiante/Inicio'))
const Clubes = lazy(() => import('./routes/estudiante/Clubes'))
const ClubDetalleEst = lazy(() => import('./routes/estudiante/ClubDetalle'))
const Postular = lazy(() => import('./routes/estudiante/Postular'))
const EventosEst = lazy(() => import('./routes/estudiante/Eventos'))
const EventoDetalle = lazy(() => import('./routes/estudiante/EventoDetalle'))
const Credenciales = lazy(() => import('./routes/estudiante/Credenciales'))
const Historial = lazy(() => import('./routes/estudiante/Historial'))
const PerfilEst = lazy(() => import('./routes/estudiante/Perfil'))
const Escaner = lazy(() => import('./routes/estudiante/Escaner'))

const LiderShell = lazy(() => import('./routes/lider/LiderShell'))
const Panel = lazy(() => import('./routes/lider/Panel'))
const Informacion = lazy(() => import('./routes/lider/Informacion'))
const Miembros = lazy(() => import('./routes/lider/Miembros'))
const Roles = lazy(() => import('./routes/lider/Roles'))
const Solicitudes = lazy(() => import('./routes/lider/Solicitudes'))
const Formularios = lazy(() => import('./routes/lider/Formularios'))
const Eventos = lazy(() => import('./routes/lider/Eventos'))
const EventoStaff = lazy(() => import('./routes/lider/EventoStaff'))
const NominaPao = lazy(() => import('./routes/lider/NominaPao'))
const Rendicion = lazy(() => import('./routes/lider/Rendicion'))
const Bitacora = lazy(() => import('./routes/lider/Bitacora'))

const GbpShell = lazy(() => import('./routes/gbp/GbpShell'))
const Catalogo = lazy(() => import('./routes/gbp/Catalogo'))
const ClubDetalle = lazy(() => import('./routes/gbp/ClubDetalle'))
const Buzon = lazy(() => import('./routes/gbp/Buzon'))
const Alta = lazy(() => import('./routes/gbp/Alta'))
const PaoConfig = lazy(() => import('./routes/gbp/PaoConfig'))
const Historico = lazy(() => import('./routes/gbp/Historico'))

function Loading() {
  return <p className="p-8 t-caption">Cargando…</p>
}

function HomeRedirect() {
  const { session, booting } = useAuth()
  if (booting) return <Loading />
  if (!session) return <Navigate to={ROUTES.LOGIN} replace />
  return <Navigate to={homeFor(session.app_role)} replace />
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path={ROUTES.REGISTRO}
          element={
            <PublicOnly>
              <RegistroPage />
            </PublicOnly>
          }
        />
        <Route
          path={ROUTES.VERIFICACION}
          element={
            <PublicOnly>
              <VerificacionPage />
            </PublicOnly>
          }
        />
        <Route
          path={ROUTES.RECUPERACION}
          element={
            <PublicOnly>
              <RecuperacionPage />
            </PublicOnly>
          }
        />

        {/* Entorno del Estudiante y del Miembro (MASTER §10 B). Mismo código
            para web y móvil: la distribución se adapta, las pantallas no. */}
        <Route
          path={ROUTES.APP}
          element={
            <RequireAuth>
              <EstudianteShell />
            </RequireAuth>
          }
        >
          <Route index element={<Inicio />} />
          <Route path="clubes" element={<Clubes />} />
          <Route path="clubes/:clubId" element={<ClubDetalleEst />} />
          <Route path="clubes/:clubId/postular" element={<Postular />} />
          <Route path="eventos" element={<EventosEst />} />
          <Route path="eventos/:eventId" element={<EventoDetalle />} />
          <Route path="credenciales" element={<Credenciales />} />
          <Route path="historial" element={<Historial />} />
          <Route path="perfil" element={<PerfilEst />} />
          <Route path="escaner" element={<Escaner />} />
        </Route>

        <Route
          path={ROUTES.LIDER}
          element={
            <RequireAuth>
              <RequireRole role="Club Leader">
                <LiderShell />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<Panel />} />
          <Route path="informacion" element={<Informacion />} />
          <Route path="miembros" element={<Miembros />} />
          <Route path="roles" element={<Roles />} />
          <Route path="solicitudes" element={<Solicitudes />} />
          <Route path="formularios" element={<Formularios />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="eventos/staff/:eventId" element={<EventoStaff />} />
          <Route path="nomina" element={<NominaPao />} />
          <Route path="rendicion" element={<Rendicion />} />
          <Route path="bitacora" element={<Bitacora />} />
        </Route>

        <Route
          path={ROUTES.GBP}
          element={
            <RequireAuth>
              <RequireRole role="GBP Admin">
                <GbpShell />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route index element={<Catalogo />} />
          <Route path="club/:clubId" element={<ClubDetalle />} />
          <Route path="buzon" element={<Buzon />} />
          <Route path="alta" element={<Alta />} />
          <Route path="pao" element={<PaoConfig />} />
          <Route path="historico" element={<Historico />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

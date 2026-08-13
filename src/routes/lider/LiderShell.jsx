import { Outlet } from 'react-router-dom'

import AppShell from '../../components/layout/AppShell'
import Screen from '../../components/layout/Screen'

/**
 * Panel del Líder. Aquí vive el núcleo del trabajo (RF-48: manejo de club),
 * con navegación propia.
 */
export default function LiderShell() {
  return (
    <AppShell>
      <Screen>
        <Outlet />
      </Screen>
    </AppShell>
  )
}

import { Outlet } from 'react-router-dom'

import AppShell from '../../components/layout/AppShell'
import Screen from '../../components/layout/Screen'

/**
 * Panel GBP. Todo su manejo es exclusivo de escritorio (RF-54).
 */
export default function GbpShell() {
  return (
    <AppShell>
      <Screen>
        <Outlet />
      </Screen>
    </AppShell>
  )
}

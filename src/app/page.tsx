'use client'

import { useState } from 'react'
import { AppShell, type TabKey } from '@/components/moto/app-shell'
import { DashboardSection } from '@/components/moto/sections/dashboard'
import { InventorySection } from '@/components/moto/sections/inventory'
import { PosSection } from '@/components/moto/sections/pos'
import { PurchasesSection } from '@/components/moto/sections/purchases'
import { ReceiptsSection } from '@/components/moto/sections/receipts'
import { ReportsSection } from '@/components/moto/sections/reports'
import { SettingsSection } from '@/components/moto/sections/settings'
import { useSettings } from '@/components/moto/types'

export default function HomePage() {
  const [tab, setTab] = useState<TabKey>('dashboard')
  const { settings, update } = useSettings()

  return (
    <AppShell active={tab} onNavigate={setTab}>
      {tab === 'dashboard' && <DashboardSection settings={settings} onNavigate={(k) => setTab(k)} />}
      {tab === 'inventory' && <InventorySection settings={settings} />}
      {tab === 'pos' && <PosSection settings={settings} />}
      {tab === 'purchases' && <PurchasesSection settings={settings} />}
      {tab === 'receipts' && <ReceiptsSection settings={settings} />}
      {tab === 'reports' && <ReportsSection settings={settings} />}
      {tab === 'settings' && <SettingsSection settings={settings} onUpdate={update} />}
    </AppShell>
  )
}

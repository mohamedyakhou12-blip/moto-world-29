'use client'

import Image from 'next/image'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Receipt as ReceiptIcon,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export type TabKey =
  | 'dashboard'
  | 'inventory'
  | 'pos'
  | 'purchases'
  | 'receipts'
  | 'reports'
  | 'settings'

interface NavItem {
  key: TabKey
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard, description: 'ملخص اليوم والشهر' },
  { key: 'inventory', label: 'المخزون', icon: Package, description: 'إدارة القطع والمنتجات' },
  { key: 'pos', label: 'نقطة البيع', icon: ShoppingCart, description: 'إنشاء بون بيع جديد' },
  { key: 'purchases', label: 'المشتريات', icon: Truck, description: 'تزويد المخزون' },
  { key: 'receipts', label: 'البونات', icon: ReceiptIcon, description: 'سجل وطباعة البونات' },
  { key: 'reports', label: 'التقارير', icon: BarChart3, description: 'تفصيل يومي وشهري' },
  { key: 'settings', label: 'الإعدادات', icon: SettingsIcon, description: 'الاسم، العملة، الشعار' },
]

interface ShellProps {
  active: TabKey
  onNavigate: (k: TabKey) => void
  children: React.ReactNode
}

export function AppShell({ active, onNavigate, children }: ShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNav = (k: TabKey) => {
    onNavigate(k)
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          <Image src="/moto-world-logo.jpg" alt="موتو ورلد 29" width={40} height={40} className="rounded-full border border-red-600/50" />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wide">موتو ورلد 29</div>
            <div className="text-[10px] text-neutral-400">إدارة المتجر</div>
          </div>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="p-2 rounded-md hover:bg-neutral-800" aria-label="القائمة">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex flex-1">
        <aside
          className={cn(
            'fixed md:sticky md:top-0 inset-y-0 md:start-0 start-0 z-50 w-72 shrink-0 bg-neutral-950 border-s border-neutral-800 flex flex-col transition-transform md:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:md:translate-x-0',
          )}
          style={{ height: '100vh' }}
        >
          <div className="p-5 border-b border-neutral-800 flex items-center gap-3">
            <Image src="/moto-world-logo.jpg" alt="موتو ورلد 29" width={56} height={56} className="rounded-full border-2 border-red-600/60 shadow-[0_0_20px_rgba(220,38,38,0.35)]" />
            <div className="leading-tight">
              <div className="text-lg font-black tracking-wide bg-gradient-to-l from-red-500 via-red-400 to-neutral-200 bg-clip-text text-transparent">موتو ورلد 29</div>
              <div className="text-[11px] tracking-[0.15em] text-neutral-400">قطع • إكسسوارات • معدات</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon
              const isActive = active === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={cn(
                    'w-full text-start px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all group',
                    isActive ? 'bg-red-600 text-white shadow-[0_0_18px_rgba(220,38,38,0.45)]' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className={cn('text-[10px]', isActive ? 'text-red-100/80' : 'text-neutral-500')}>{item.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-neutral-800 text-[10px] text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>البيانات محفوظة محلياً</span>
            </div>
            <div className="mt-1">© موتو ورلد 29 — الإصدار 2.0</div>
          </div>
        </aside>

        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />}

        <main className="flex-1 min-w-0 bg-neutral-950">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

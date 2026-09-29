'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  ShoppingCart,
  Package,
  AlertTriangle,
  Boxes,
  Trophy,
  RefreshCw,
  Truck,
  BarChart3,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '../app-shell'
import { formatMoney, formatNumber, categoryLabel } from '@/lib/format'
import type { DashboardData, Settings } from '../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  settings: Settings | null
  onNavigate: (k: 'inventory' | 'sales' | 'purchases' | 'reports' | 'settings') => void
}

export function DashboardSection({ settings, onNavigate }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const currency = settings?.currency || 'DH'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const tz = new Date().getTimezoneOffset()
      const res = await fetch(`/api/reports?type=dashboard&tz=${tz}`, { cache: 'no-store' })
      const json = await res.json()
      setData(json)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les données', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const marginToday = data ? (data.today.revenue > 0 ? (data.today.profit / data.today.revenue) * 100 : 0) : 0
  const marginMonth = data ? (data.month.revenue > 0 ? (data.month.profit / data.month.revenue) * 100 : 0) : 0

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`Aperçu en temps réel • ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        }
      />

      {/* Today + Month KPIs */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {/* TODAY */}
        <Card className="bg-gradient-to-br from-red-950/40 via-neutral-900 to-neutral-900 border-red-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-red-400 font-semibold">Aujourd'hui</div>
              <div className="text-sm text-neutral-400">{new Date().toLocaleDateString('fr-FR')}</div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-600/20 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-red-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <KpiBlock
              label="Chiffre d'affaires"
              value={formatMoney(data?.today.revenue || 0, currency)}
              icon={<Wallet className="h-4 w-4" />}
              tone="neutral"
            />
            <KpiBlock
              label="Bénéfice net"
              value={formatMoney(data?.today.profit || 0, currency)}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="green"
            />
            <KpiBlock
              label="Coût marchandises"
              value={formatMoney(data?.today.cost || 0, currency)}
              icon={<TrendingDown className="h-4 w-4" />}
              tone="red"
            />
            <KpiBlock
              label="Ventes"
              value={formatNumber(data?.today.count || 0)}
              icon={<ShoppingBag className="h-4 w-4" />}
              tone="blue"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Marge bénéficiaire</span>
            <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-700/40">
              {marginToday.toFixed(1)}%
            </Badge>
          </div>
        </Card>

        {/* MONTH */}
        <Card className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-red-950/30 border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Ce mois-ci</div>
              <div className="text-sm text-neutral-400">
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-neutral-300" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <KpiBlock
              label="Chiffre d'affaires"
              value={formatMoney(data?.month.revenue || 0, currency)}
              icon={<Wallet className="h-4 w-4" />}
              tone="neutral"
            />
            <KpiBlock
              label="Bénéfice net"
              value={formatMoney(data?.month.profit || 0, currency)}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="green"
            />
            <KpiBlock
              label="Coût marchandises"
              value={formatMoney(data?.month.cost || 0, currency)}
              icon={<TrendingDown className="h-4 w-4" />}
              tone="red"
            />
            <KpiBlock
              label="Ventes"
              value={formatNumber(data?.month.count || 0)}
              icon={<ShoppingBag className="h-4 w-4" />}
              tone="blue"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Marge bénéficiaire</span>
            <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-700/40">
              {marginMonth.toFixed(1)}%
            </Badge>
          </div>
        </Card>
      </div>

      {/* 7-day chart */}
      <Card className="bg-neutral-900 border-neutral-800 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">7 derniers jours</h3>
            <p className="text-xs text-neutral-400">Chiffre d'affaires vs Bénéfice</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> CA
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Bénéfice
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.last7Days || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="label" stroke="#737373" fontSize={12} />
              <YAxis stroke="#737373" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, color: '#fff' }}
                formatter={(v: number, n: string) => [formatMoney(v, currency), n === 'revenue' ? 'CA' : 'Bénéfice']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bottom row: top products + low stock + inventory value */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Inventory value */}
        <Card className="bg-neutral-900 border-neutral-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Boxes className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Valeur du stock</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-neutral-400">Coût d'achat</div>
              <div className="text-xl font-bold text-white">{formatMoney(data?.inventoryValue || 0, currency)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Potentiel de vente</div>
              <div className="text-xl font-bold text-emerald-400">{formatMoney(data?.potentialRevenue || 0, currency)}</div>
            </div>
            <div className="pt-3 border-t border-neutral-800">
              <div className="text-xs text-neutral-400">Bénéfice potentiel</div>
              <div className="text-lg font-bold text-red-400">
                {formatMoney((data?.potentialRevenue || 0) - (data?.inventoryValue || 0), currency)}
              </div>
            </div>
            <div className="text-xs text-neutral-500 pt-1">
              {formatNumber(data?.totalProducts || 0)} produit(s) en stock
            </div>
          </div>
        </Card>

        {/* Top products */}
        <Card className="bg-neutral-900 border-neutral-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Top ventes (mois)</h3>
          </div>
          {data && data.topProducts.length > 0 ? (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {data.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-500/20 text-amber-300' :
                    i === 1 ? 'bg-neutral-700 text-neutral-200' :
                    i === 2 ? 'bg-orange-700/30 text-orange-300' :
                    'bg-neutral-800 text-neutral-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{p.name}</div>
                    <div className="text-xs text-neutral-400">{p.quantity} vendu(s) • {formatMoney(p.revenue, currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucune vente ce mois-ci" />
          )}
        </Card>

        {/* Low stock */}
        <Card className="bg-neutral-900 border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h3 className="text-sm font-bold text-white">Stock faible</h3>
            </div>
            <Button size="sm" variant="ghost" className="text-xs text-neutral-400 hover:text-white" onClick={() => onNavigate('purchases')}>
              Réappro
            </Button>
          </div>
          {data && data.lowStock.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {data.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 py-1">
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-500">{categoryLabel(p.category)}</div>
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${p.quantity === 0 ? 'border-red-600 text-red-400' : 'border-amber-600 text-amber-400'}`}>
                    {p.quantity} restant(s)
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Tous les stocks sont OK" />
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction icon={<ShoppingCart className="h-5 w-5" />} label="Nouvelle vente" onClick={() => onNavigate('sales')} tone="red" />
        <QuickAction icon={<Truck className="h-5 w-5" />} label="Nouvel achat" onClick={() => onNavigate('purchases')} tone="amber" />
        <QuickAction icon={<Package className="h-5 w-5" />} label="Gérer stock" onClick={() => onNavigate('inventory')} tone="blue" />
        <QuickAction icon={<BarChart3 className="h-5 w-5" />} label="Voir rapports" onClick={() => onNavigate('reports')} tone="emerald" />
      </div>
    </div>
  )
}

function KpiBlock({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'neutral' | 'green' | 'red' | 'blue'
}) {
  const toneMap = {
    neutral: 'text-white',
    green: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-sky-400',
  }
  return (
    <div className="bg-neutral-950/50 rounded-lg p-3 border border-neutral-800">
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-lg font-bold ${toneMap[tone]}`}>{value}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="text-center py-6 text-xs text-neutral-500">
      {text}
    </div>
  )
}

function QuickAction({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  tone: 'red' | 'amber' | 'blue' | 'emerald'
}) {
  const toneMap = {
    red: 'border-red-900/50 hover:bg-red-950/40 hover:border-red-700 text-red-300',
    amber: 'border-amber-900/50 hover:bg-amber-950/40 hover:border-amber-700 text-amber-300',
    blue: 'border-sky-900/50 hover:bg-sky-950/40 hover:border-sky-700 text-sky-300',
    emerald: 'border-emerald-900/50 hover:bg-emerald-950/40 hover:border-emerald-700 text-emerald-300',
  }
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border bg-neutral-900 transition-all ${toneMap[tone]}`}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  )
}
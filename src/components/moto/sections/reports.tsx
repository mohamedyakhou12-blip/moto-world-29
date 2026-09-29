'use client'

import { useEffect, useState, useCallback } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { Calendar, TrendingUp, TrendingDown, Wallet, ShoppingBag, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '../app-shell'
import { formatMoney, formatNumber, formatDateTime, todayISO } from '@/lib/format'
import type { Settings, SaleWithProduct } from '../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  settings: Settings | null
}

type Mode = 'daily' | 'monthly'

interface DailyReport {
  date: string
  sales: SaleWithProduct[]
  revenue: number
  cost: number
  profit: number
  count: number
}

interface MonthlyReport {
  year: number
  month: number
  monthLabel: string
  sales: SaleWithProduct[]
  byDay: Array<{ day: number; revenue: number; profit: number; cost: number; count: number }>
  revenue: number
  cost: number
  profit: number
  count: number
}

export function ReportsSection({ settings }: Props) {
  const [mode, setMode] = useState<Mode>('daily')
  const [date, setDate] = useState<string>(todayISO())
  const [monthDate, setMonthDate] = useState<string>(todayISO().slice(0, 7)) // YYYY-MM
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const currency = settings?.currency || 'DH'
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (mode === 'daily') {
        const res = await fetch(`/api/reports?type=daily&date=${date}`, { cache: 'no-store' })
        const data = await res.json()
        setDaily(data)
      } else {
        const [y, m] = monthDate.split('-')
        const res = await fetch(`/api/reports?type=monthly&year=${y}&month=${m}`, { cache: 'no-store' })
        const data = await res.json()
        setMonthly(data)
      }
    } catch {
      toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [mode, date, monthDate, toast])

  useEffect(() => {
    load()
  }, [load])

  const goPrev = () => {
    if (mode === 'daily') {
      const d = new Date(date + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    } else {
      const [y, m] = monthDate.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      d.setMonth(d.getMonth() - 1)
      setMonthDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
  }
  const goNext = () => {
    if (mode === 'daily') {
      const d = new Date(date + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    } else {
      const [y, m] = monthDate.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      d.setMonth(d.getMonth() + 1)
      setMonthDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
  }

  const report = mode === 'daily' ? daily : monthly
  const revenue = report?.revenue || 0
  const cost = report?.cost || 0
  const profit = report?.profit || 0
  const count = report?.count || 0
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0

  return (
    <div>
      <PageHeader
        title="Rapports"
        subtitle="Consultez le détail de vos ventes et bénéfices par jour ou par mois."
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        }
      />

      {/* Mode switch */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1 self-start">
          <button
            onClick={() => setMode('daily')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              mode === 'daily' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Journalier
          </button>
          <button
            onClick={() => setMode('monthly')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              mode === 'monthly' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Mensuel
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={goPrev} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {mode === 'daily' ? (
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-neutral-900 border-neutral-800 text-white w-44"
            />
          ) : (
            <Input
              type="month"
              value={monthDate}
              onChange={(e) => setMonthDate(e.target.value)}
              className="bg-neutral-900 border-neutral-800 text-white w-44"
            />
          )}
          <Button size="sm" variant="outline" onClick={goNext} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { if (mode === 'daily') setDate(todayISO()); else setMonthDate(todayISO().slice(0, 7)) }} className="text-neutral-300 hover:text-white">
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Chiffre d'affaires" value={formatMoney(revenue, currency)} icon={<Wallet className="h-5 w-5" />} tone="neutral" />
        <KpiCard label="Coût marchandises" value={formatMoney(cost, currency)} icon={<TrendingDown className="h-5 w-5" />} tone="red" />
        <KpiCard label="Bénéfice net" value={formatMoney(profit, currency)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <KpiCard label="Nombre de ventes" value={formatNumber(count)} icon={<ShoppingBag className="h-5 w-5" />} tone="blue" />
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
        <span className="text-sm text-neutral-300">Marge bénéficiaire:</span>
        <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-700/40">{margin.toFixed(1)}%</Badge>
      </div>

      {/* Monthly chart */}
      {mode === 'monthly' && monthly && monthly.byDay.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800 p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-4">Évolution journalière — {monthly.monthLabel}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="day" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, color: '#fff' }}
                  formatter={(v: number, n: string) => [formatMoney(v, currency), n === 'revenue' ? 'CA' : n === 'profit' ? 'Bénéfice' : 'Coût']}
                  labelFormatter={(l) => `Jour ${l}`}
                />
                <Legend formatter={(v) => (v === 'revenue' ? 'CA' : v === 'profit' ? 'Bénéfice' : 'Coût')} />
                <Bar dataKey="revenue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="#737373" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Sales detail */}
      <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neutral-400" />
          <h3 className="text-sm font-bold text-white">
            Détail des ventes
            {mode === 'daily' && daily ? ` — ${daily.date}` : monthly ? ` — ${monthly.monthLabel}` : ''}
          </h3>
          <Badge variant="outline" className="ml-auto border-neutral-700 text-neutral-300">{count} vente(s)</Badge>
        </div>
        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950/50 border-b border-neutral-800 sticky top-0">
              <tr className="text-left text-neutral-400">
                <th className="px-4 py-2 font-semibold">Date/Heure</th>
                <th className="px-4 py-2 font-semibold">Produit</th>
                <th className="px-4 py-2 font-semibold text-center">Qté</th>
                <th className="px-4 py-2 font-semibold text-right">Prix vente</th>
                <th className="px-4 py-2 font-semibold text-right">Coût</th>
                <th className="px-4 py-2 font-semibold text-right">Total</th>
                <th className="px-4 py-2 font-semibold text-right">Bénéfice</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">Chargement...</td>
                </tr>
              )}
              {!loading && (mode === 'daily' ? daily : monthly) && (mode === 'daily' ? daily!.sales : monthly!.sales).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    Aucune vente sur cette période
                  </td>
                </tr>
              )}
              {!loading && (mode === 'daily' ? daily?.sales : monthly?.sales)?.map((s) => (
                <tr key={s.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30">
                  <td className="px-4 py-2 text-xs text-neutral-400">{formatDateTime(s.createdAt)}</td>
                  <td className="px-4 py-2 text-white">{s.product.name}</td>
                  <td className="px-4 py-2 text-center text-neutral-300">{s.quantity}</td>
                  <td className="px-4 py-2 text-right text-neutral-300">{formatMoney(s.unitPrice, currency)}</td>
                  <td className="px-4 py-2 text-right text-neutral-400">{formatMoney(s.unitCost * s.quantity, currency)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-white">{formatMoney(s.total, currency)}</td>
                  <td className="px-4 py-2 text-right text-emerald-400 font-semibold">{formatMoney(s.profit, currency)}</td>
                </tr>
              ))}
            </tbody>
            {!loading && count > 0 && (
              <tfoot className="bg-neutral-950/50 border-t-2 border-neutral-800 sticky bottom-0">
                <tr className="font-bold text-white">
                  <td className="px-4 py-3" colSpan={3}>TOTAL</td>
                  <td className="px-4 py-3 text-right text-neutral-400"></td>
                  <td className="px-4 py-3 text-right text-neutral-300">{formatMoney(cost, currency)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(revenue, currency)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{formatMoney(profit, currency)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  )
}

function KpiCard({
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
  const bgMap = {
    neutral: 'bg-neutral-800',
    green: 'bg-emerald-950/40',
    red: 'bg-red-950/40',
    blue: 'bg-sky-950/40',
  }
  return (
    <Card className={`border-neutral-800 p-4 ${bgMap[tone]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-400">{label}</span>
        <span className="text-neutral-400">{icon}</span>
      </div>
      <div className={`text-xl font-bold ${toneMap[tone]}`}>{value}</div>
    </Card>
  )
}

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
import type { Settings, Receipt, ReceiptWithItems } from '../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  settings: Settings | null
}

type Mode = 'daily' | 'monthly'

interface DailyReport {
  date: string
  receipts: ReceiptWithItems[]
  revenue: number
  cost: number
  profit: number
  count: number
}

interface MonthlyReport {
  year: number
  month: number
  monthLabel: string
  receipts: Receipt[]
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
  const currency = settings?.currency || 'دج'
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
      toast({ title: 'خطأ', description: 'تعذّر التحميل', variant: 'destructive' })
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
        title="التقارير"
        subtitle="اطّلع على تفصيل مبيعاتك وأرباحك يومياً أو شهرياً."
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
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
            يومي
          </button>
          <button
            onClick={() => setMode('monthly')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              mode === 'monthly' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            شهري
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={goPrev} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <ChevronRight className="h-4 w-4" />
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
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { if (mode === 'daily') setDate(todayISO()); else setMonthDate(todayISO().slice(0, 7)) }} className="text-neutral-300 hover:text-white">
            اليوم
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="رقم المعاملات" value={formatMoney(revenue, currency)} icon={<Wallet className="h-5 w-5" />} tone="neutral" />
        <KpiCard label="تكلفة البضاعة" value={formatMoney(cost, currency)} icon={<TrendingDown className="h-5 w-5" />} tone="red" />
        <KpiCard label="صافي الربح" value={formatMoney(profit, currency)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <KpiCard label="عدد المبيعات" value={formatNumber(count)} icon={<ShoppingBag className="h-5 w-5" />} tone="blue" />
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
        <span className="text-sm text-neutral-300">هامش الربح:</span>
        <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-700/40">{margin.toFixed(1)}%</Badge>
      </div>

      {/* Monthly chart */}
      {mode === 'monthly' && monthly && monthly.byDay.length > 0 && (
        <Card className="bg-neutral-900 border-neutral-800 p-5 mb-6">
          <h3 className="text-sm font-bold text-white mb-4">التطور اليومي — {monthly.monthLabel}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="day" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, color: '#fff', direction: 'rtl' }}
                  formatter={(v: number, n: string) => [formatMoney(v, currency), n === 'revenue' ? 'رقم المعاملات' : n === 'profit' ? 'الربح' : 'التكلفة']}
                  labelFormatter={(l) => `اليوم ${l}`}
                />
                <Legend formatter={(v) => (v === 'revenue' ? 'رقم المعاملات' : v === 'profit' ? 'الربح' : 'التكلفة')} />
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
            تفصيل البونات
            {mode === 'daily' && daily ? ` — ${daily.date}` : monthly ? ` — ${monthly.monthLabel}` : ''}
          </h3>
          <Badge variant="outline" className="ms-auto border-neutral-700 text-neutral-300">{count} بون</Badge>
        </div>
        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950/50 border-b border-neutral-800 sticky top-0">
              <tr className="text-neutral-400">
                <th className="px-4 py-2 font-semibold text-start">#</th>
                <th className="px-4 py-2 font-semibold text-start">التاريخ</th>
                <th className="px-4 py-2 font-semibold text-start">الزبون</th>
                <th className="px-4 py-2 font-semibold text-center">القطع</th>
                <th className="px-4 py-2 font-semibold text-end">التكلفة</th>
                <th className="px-4 py-2 font-semibold text-end">الإجمالي</th>
                <th className="px-4 py-2 font-semibold text-end">الربح</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">جارٍ التحميل...</td>
                </tr>
              )}
              {!loading && (mode === 'daily' ? daily : monthly) && (mode === 'daily' ? daily!.receipts : monthly!.receipts).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    لا توجد بونات في هذه الفترة
                  </td>
                </tr>
              )}
              {!loading && (mode === 'daily' ? daily?.receipts : monthly?.receipts)?.map((r) => (
                <tr key={r.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30">
                  <td className="px-4 py-2"><Badge className="bg-red-600/20 text-red-300 border border-red-700/40">#{r.number}</Badge></td>
                  <td className="px-4 py-2 text-xs text-neutral-400">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-2 text-white">{r.customerName || <span className="text-neutral-500">—</span>}</td>
                  <td className="px-4 py-2 text-center text-neutral-300">{r.itemCount}</td>
                  <td className="px-4 py-2 text-end text-neutral-400">{formatMoney(r.total - r.profit, currency)}</td>
                  <td className="px-4 py-2 text-end font-semibold text-white">{formatMoney(r.total, currency)}</td>
                  <td className="px-4 py-2 text-end text-emerald-400 font-semibold">{formatMoney(r.profit, currency)}</td>
                </tr>
              ))}
            </tbody>
            {!loading && count > 0 && (
              <tfoot className="bg-neutral-950/50 border-t-2 border-neutral-800 sticky bottom-0">
                <tr className="font-bold text-white">
                  <td className="px-4 py-3" colSpan={4}>الإجمالي</td>
                  <td className="px-4 py-3 text-end text-neutral-300">{formatMoney(cost, currency)}</td>
                  <td className="px-4 py-3 text-end">{formatMoney(revenue, currency)}</td>
                  <td className="px-4 py-3 text-end text-emerald-400">{formatMoney(profit, currency)}</td>
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

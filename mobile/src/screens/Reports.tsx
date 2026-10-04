// ============================================================
//  Reports — التقارير (يومي / شهري)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { COLORS, Card, PageHeader, Button, Badge } from '../components/ui'
import { formatMoney, formatNumber, formatDateTime, todayISO } from '../utils/format'
import { dbGetDayReport, dbGetMonthReport, DayReport, MonthReport, Settings } from '../db/database'

export default function ReportsScreen({ settings, onBack }: { settings: Settings | null; onBack: () => void }) {
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily')
  const [date, setDate] = useState(todayISO())
  const [monthDate, setMonthDate] = useState(todayISO().slice(0, 7))
  const [daily, setDaily] = useState<DayReport | null>(null)
  const [monthly, setMonthly] = useState<MonthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const currency = settings?.currency || 'دج'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (mode === 'daily') {
        setDaily(await dbGetDayReport(date))
      } else {
        const [y, m] = monthDate.split('-')
        setMonthly(await dbGetMonthReport(Number(y), Number(m)))
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [mode, date, monthDate])

  useEffect(() => { load() }, [load])

  const report = mode === 'daily' ? daily : monthly
  const revenue = report?.revenue || 0
  const cost = report?.cost || 0
  const profit = report?.profit || 0
  const count = report?.count || 0
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0

  const goPrev = () => {
    if (mode === 'daily') {
      const d = new Date(date + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      setDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))
    } else {
      const [y, m] = monthDate.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      d.setMonth(d.getMonth() - 1)
      setMonthDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'))
    }
  }
  const goNext = () => {
    if (mode === 'daily') {
      const d = new Date(date + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      setDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))
    } else {
      const [y, m] = monthDate.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      d.setMonth(d.getMonth() + 1)
      setMonthDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'))
    }
  }

  const receipts = mode === 'daily' ? daily?.receipts : monthly?.receipts

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900' }}>التقارير</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 8, padding: 4, marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setMode('daily')}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6, backgroundColor: mode === 'daily' ? COLORS.red : 'transparent' }}
          >
            <Text style={{ color: mode === 'daily' ? '#fff' : COLORS.textMuted, fontSize: 14, fontWeight: '700' }}>يومي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('monthly')}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6, backgroundColor: mode === 'monthly' ? COLORS.red : 'transparent' }}
          >
            <Text style={{ color: mode === 'monthly' ? '#fff' : COLORS.textMuted, fontSize: 14, fontWeight: '700' }}>شهري</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={goPrev} style={{ padding: 8 }}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TextInput
            value={mode === 'daily' ? date : monthDate}
            onChangeText={(t) => mode === 'daily' ? setDate(t) : setMonthDate(t)}
            style={{ color: COLORS.text, fontSize: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 8, flex: 1, marginHorizontal: 8, textAlign: 'center' }}
            placeholder="YYYY-MM-DD"
          />
          <TouchableOpacity onPress={goNext} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 16 }}>
        {/* KPIs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <KpiCard label="رقم المعاملات" value={formatMoney(revenue, currency)} icon="cash" tone="neutral" />
          <KpiCard label="صافي الربح" value={formatMoney(profit, currency)} icon="trending-up" tone="green" />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <KpiCard label="التكلفة" value={formatMoney(cost, currency)} icon="trending-down" tone="red" />
          <KpiCard label="عدد البونات" value={formatNumber(count)} icon="receipt" tone="blue" />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.emeraldDark + '40', borderWidth: 1, borderColor: COLORS.emeraldDark, borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>هامش الربح</Text>
          <Text style={{ color: COLORS.emerald, fontSize: 14, fontWeight: '700' }}>{margin.toFixed(1)}%</Text>
        </View>

        {/* Monthly chart */}
        {mode === 'monthly' && monthly && monthly.byDay.length > 0 ? (
          <Card style={{ marginBottom: 8 }}>
            <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>التطور اليومي — {monthly.monthLabel}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, paddingVertical: 8 }}>
              {monthly.byDay.map((d) => {
                const maxRev = Math.max(...monthly.byDay.map((x) => x.revenue), 1)
                const h = (d.revenue / maxRev) * 80
                return (
                  <View key={d.day} style={{ flex: 1, alignItems: 'center', marginHorizontal: 1 }}>
                    <View style={{ width: '100%', height: Math.max(h, 2), backgroundColor: COLORS.red, borderRadius: 2 }} />
                    <Text style={{ color: COLORS.textDim, fontSize: 8, marginTop: 2 }}>{d.day}</Text>
                  </View>
                )
              })}
            </View>
          </Card>
        ) : null}

        {/* Receipts list */}
        <Card>
          <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
            تفصيل البونات {mode === 'daily' && daily ? `— ${daily.date}` : monthly ? `— ${monthly.monthLabel}` : ''}
          </Text>
          <Badge color={COLORS.textMuted}>{count} بون</Badge>
          <View style={{ marginTop: 8 }}>
            {!loading && count === 0 ? (
              <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 16 }}>لا توجد بونات</Text>
            ) : (
              receipts?.map((r) => (
                <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.red, fontSize: 12, fontWeight: '700' }}>#{r.number}</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>{formatDateTime(r.createdAt)}</Text>
                    <Text style={{ color: COLORS.text, fontSize: 12 }}>{r.customerName || '—'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '700' }}>{formatMoney(r.total, currency)}</Text>
                    <Text style={{ color: COLORS.emerald, fontSize: 11 }}>+{formatMoney(r.profit, currency)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </Card>
      </ScrollView>
    </View>
  )
}

function KpiCard({ label, value, icon, tone }: { label: string; value: string; icon: string; tone: 'neutral' | 'green' | 'red' | 'blue' }) {
  const toneMap = { neutral: COLORS.text, green: COLORS.emerald, red: COLORS.red, blue: COLORS.sky }
  const bgMap = { neutral: COLORS.card, green: COLORS.emeraldDark + '40', red: COLORS.redDark + '40', blue: COLORS.skyDark + '40' }
  return (
    <View style={{ flex: 1, backgroundColor: bgMap[tone], borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>{label}</Text>
        <Ionicons name={icon as any} size={14} color={COLORS.textMuted} />
      </View>
      <Text style={{ color: toneMap[tone], fontSize: 15, fontWeight: '700' }}>{value}</Text>
    </View>
  )
}

// ============================================================
//  Dashboard — لوحة القيادة
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { COLORS, Card, PageHeader, Button } from '../components/ui'
import { formatMoney, formatNumber, categoryLabel } from '../utils/format'
import { dbGetDashboard, DashboardData, Settings } from '../db/database'

export default function DashboardScreen({ settings }: { settings: Settings | null }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const currency = settings?.currency || 'دج'

  const load = useCallback(async () => {
    try {
      const d = await dbGetDashboard()
      setData(d)
    } catch (e) {
      console.error('Dashboard load:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 100)
    return () => clearTimeout(t)
  }, [load])

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const marginToday = data && data.today.revenue > 0 ? (data.today.profit / data.today.revenue) * 100 : 0
  const marginMonth = data && data.month.revenue > 0 ? (data.month.profit / data.month.revenue) * 100 : 0

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.red} />}
    >
      <PageHeader
        title="لوحة القيادة"
        subtitle={new Date().toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={
          <Button title="تحديث" size="sm" outline color={COLORS.textMuted} icon="refresh" onPress={onRefresh} />
        }
      />

      {/* KPIs */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Card style={{ flex: 1, backgroundColor: COLORS.redDark + '40', borderColor: COLORS.redDark }}>
          <Text style={{ color: COLORS.redLight, fontSize: 11, fontWeight: '700' }}>اليوم</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 8 }}>{new Date().toLocaleDateString('ar-DZ')}</Text>
          <KpiRow label="رقم المعاملات" value={formatMoney(data?.today.revenue || 0, currency)} />
          <KpiRow label="صافي الربح" value={formatMoney(data?.today.profit || 0, currency)} color={COLORS.emerald} />
          <KpiRow label="التكلفة" value={formatMoney(data?.today.cost || 0, currency)} color={COLORS.red} />
          <KpiRow label="المبيعات" value={formatNumber(data?.today.count || 0)} color={COLORS.sky} />
          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>هامش الربح</Text>
            <Text style={{ color: COLORS.emerald, fontSize: 12, fontWeight: '700' }}>{marginToday.toFixed(1)}%</Text>
          </View>
        </Card>
      </View>

      <Card style={{ marginBottom: 8, backgroundColor: COLORS.card }}>
        <Text style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700' }}>هذا الشهر</Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 8 }}>{new Date().toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' })}</Text>
        <KpiRow label="رقم المعاملات" value={formatMoney(data?.month.revenue || 0, currency)} />
        <KpiRow label="صافي الربح" value={formatMoney(data?.month.profit || 0, currency)} color={COLORS.emerald} />
        <KpiRow label="التكلفة" value={formatMoney(data?.month.cost || 0, currency)} color={COLORS.red} />
        <KpiRow label="المبيعات" value={formatNumber(data?.month.count || 0)} color={COLORS.sky} />
        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>هامش الربح</Text>
          <Text style={{ color: COLORS.emerald, fontSize: 12, fontWeight: '700' }}>{marginMonth.toFixed(1)}%</Text>
        </View>
      </Card>

      {/* Stock value */}
      <Card style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="cube" size={18} color={COLORS.amber} style={{ marginRight: 6 }} />
          <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>قيمة المخزون</Text>
        </View>
        <KpiRow label="تكلفة الشراء" value={formatMoney(data?.inventoryValue || 0, currency)} />
        <KpiRow label="الإيراد المحتمل" value={formatMoney(data?.potentialRevenue || 0, currency)} color={COLORS.emerald} />
        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <KpiRow label="الربح المحتمل" value={formatMoney((data?.potentialRevenue || 0) - (data?.inventoryValue || 0), currency)} color={COLORS.red} />
          <Text style={{ color: COLORS.textDim, fontSize: 11, marginTop: 4 }}>{formatNumber(data?.totalProducts || 0)} منتج في المخزون</Text>
        </View>
      </Card>

      {/* Top products */}
      <Card style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="trophy" size={18} color={COLORS.amber} style={{ marginRight: 6 }} />
          <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>الأكثر مبيعاً (الشهر)</Text>
        </View>
        {data && data.topProducts.length > 0 ? (
          data.topProducts.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: i === 0 ? COLORS.amber + '30' : i === 1 ? '#404040' : i === 2 ? '#9a3412' : COLORS.cardAlt,
                marginRight: 10,
              }}>
                <Text style={{ color: i === 0 ? COLORS.amber : i === 1 ? '#d4d4d4' : i === 2 ? '#fb923c' : COLORS.textDim, fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 14 }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>{p.quantity} مبيع • {formatMoney(p.revenue, currency)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 16 }}>لا توجد مبيعات هذا الشهر</Text>
        )}
      </Card>

      {/* Low stock */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="warning" size={18} color={COLORS.red} style={{ marginRight: 6 }} />
          <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>مخزون منخفض</Text>
        </View>
        {data && data.lowStock.length > 0 ? (
          data.lowStock.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 14 }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: COLORS.textDim, fontSize: 10 }}>{categoryLabel(p.category)}</Text>
              </View>
              <View style={{ borderWidth: 1, borderColor: p.quantity === 0 ? COLORS.red : COLORS.amber, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: p.quantity === 0 ? COLORS.red : COLORS.amber, fontSize: 11, fontWeight: '600' }}>{p.quantity} متبقٍ</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 16 }}>كل المخزون بحالة جيدة</Text>
        )}
      </Card>
    </ScrollView>
  )
}

function KpiRow({ label, value, color = COLORS.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{value}</Text>
    </View>
  )
}

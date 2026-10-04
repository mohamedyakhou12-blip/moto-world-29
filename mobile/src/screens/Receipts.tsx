// ============================================================
//  Receipts — سجل البونات
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

import { COLORS, Card, PageHeader, Button, Badge, ModalView } from '../components/ui'
import { formatMoney, formatDateTime } from '../utils/format'
import { dbGetReceipts, dbGetReceipt, dbDeleteReceipt, Receipt, Settings } from '../db/database'

export default function ReceiptsScreen({ settings }: { settings: Settings | null }) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Receipt | null>(null)
  const currency = settings?.currency || 'دج'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await dbGetReceipts()
      setReceipts(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = receipts.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return String(r.number).includes(s) || (r.customerName || '').toLowerCase().includes(s)
  })

  const totalRevenue = filtered.reduce((s, r) => s + r.total, 0)
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0)

  const viewReceipt = async (id: string) => {
    try {
      const r = await dbGetReceipt(id)
      if (r) setViewing(r)
    } catch (e) { Alert.alert('خطأ', 'تعذر فتح البون') }
  }

  const shareReceipt = async (receipt: Receipt) => {
    if (!receipt.items) return
    const storeName = settings?.storeName || 'Moto World 29'
    const itemsRows = receipt.items.map((i) => `<tr><td>${i.productName}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:end">${formatMoney(i.unitPrice, currency)}</td><td style="text-align:end">${formatMoney(i.total, currency)}</td></tr>`).join('')
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
      * { font-family: Tahoma, sans-serif; box-sizing: border-box; }
      body { margin: 0; padding: 12px; color: #000; }
      .receipt { max-width: 320px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
      .store-name { font-size: 20px; font-weight: bold; }
      .info { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: start; border-bottom: 1px solid #000; padding: 4px; }
      td { padding: 4px; border-bottom: 1px dotted #ccc; }
      .totals { margin-top: 10px; font-size: 13px; }
      .totals div { display: flex; justify-content: space-between; padding: 2px 0; }
      .grand { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 6px; margin-top: 4px; }
      .footer { margin-top: 14px; text-align: center; font-size: 11px; color: #444; border-top: 2px dashed #000; padding-top: 8px; }
    </style></head><body><div class="receipt">
      <div class="header"><div class="store-name">${storeName}</div><div style="font-size:11px;color:#444;">قطع • إكسسوارات • معدات</div></div>
      <div class="info"><span>بون #: <strong>${receipt.number}</strong></span><span>${formatDateTime(receipt.createdAt)}</span></div>
      ${receipt.customerName ? `<div class="info"><span>الزبون: <strong>${receipt.customerName}</strong></span></div>` : ''}
      <table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>${itemsRows}</tbody></table>
      <div class="totals">
        <div><span>المجموع الفرعي:</span><span>${formatMoney(receipt.subtotal, currency)}</span></div>
        ${receipt.discount > 0 ? `<div><span>الخصم:</span><span>-${formatMoney(receipt.discount, currency)}</span></div>` : ''}
        <div class="grand"><span>الإجمالي:</span><span>${formatMoney(receipt.total, currency)}</span></div>
      </div>
      <div class="footer">شكراً لزيارتكم<br>${storeName}</div>
    </div></body></html>`
    try {
      const { uri } = await Print.printToFileAsync({ html })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `بون #${receipt.number}` })
      }
    } catch (e: any) { Alert.alert('خطأ', e.message) }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <PageHeader
          title="سجل البونات"
          subtitle={`${receipts.length} بون • إيراد: ${formatMoney(totalRevenue, currency)}`}
        />
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
          borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 10, paddingHorizontal: 12,
        }}>
          <Ionicons name="search" size={20} color={COLORS.red} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث برقم البون أو اسم الزبون..."
            placeholderTextColor={COLORS.textDim}
            style={{ flex: 1, color: COLORS.text, paddingVertical: 10, fontSize: 15, textAlign: 'right' }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textDim} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => viewReceipt(item.id)}
            style={{ backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
          >
            <View style={{ width: 48, alignItems: 'center' }}>
              <View style={{ backgroundColor: COLORS.redDark + '60', borderWidth: 1, borderColor: COLORS.red, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: COLORS.redLight, fontSize: 11, fontWeight: '700' }}>#{item.number}</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginHorizontal: 10 }}>
              <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '600' }}>{item.customerName || '—'}</Text>
              <Text style={{ color: COLORS.textDim, fontSize: 10 }}>{formatDateTime(item.createdAt)} • {item.itemCount} قطعة</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>{formatMoney(item.total, currency)}</Text>
              <Text style={{ color: COLORS.emerald, fontSize: 11 }}>+{formatMoney(item.profit, currency)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textDim} />
            <Text style={{ color: COLORS.textMuted, marginTop: 8, fontSize: 14 }}>
              {search ? 'لا توجد نتائج' : 'لا توجد بونات بعد'}
            </Text>
          </View>
        }
      />

      {viewing && (
        <ModalView
          visible={true}
          onClose={() => setViewing(null)}
          title={`بون #${viewing.number}`}
          footer={
            <>
              <Button title="حذف" color={COLORS.red} outline onPress={() => {
                Alert.alert('إلغاء البون؟', 'ستُعاد القطع للمخزون', [
                  { text: 'إلغاء' },
                  { text: 'إلغاء البون', style: 'destructive', onPress: async () => {
                    await dbDeleteReceipt(viewing.id)
                    setViewing(null); load()
                  } },
                ])
              }} style={{ flex: 1 }} />
              <Button title="مشاركة PDF" icon="share" onPress={() => shareReceipt(viewing)} style={{ flex: 1 }} />
            </>
          }
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
            <Text style={{ color: '#000', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>{settings?.storeName || 'Moto World 29'}</Text>
            <Text style={{ color: '#444', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>قطع • إكسسوارات • معدات</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#000', fontSize: 12 }}>بون #: <Text style={{ fontWeight: '700' }}>{viewing.number}</Text></Text>
              <Text style={{ color: '#444', fontSize: 11 }}>{formatDateTime(viewing.createdAt)}</Text>
            </View>
            {viewing.customerName ? <Text style={{ color: '#000', fontSize: 12, marginBottom: 8 }}>الزبون: {viewing.customerName}</Text> : null}
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', paddingTop: 8, marginTop: 4 }}>
              {viewing.items?.map((i) => (
                <View key={i.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#000', fontSize: 12, flex: 1 }}>{i.productName} ×{i.quantity}</Text>
                  <Text style={{ color: '#000', fontSize: 12 }}>{formatMoney(i.total, currency)}</Text>
                </View>
              ))}
            </View>
            <View style={{ borderTopWidth: 2, borderTopColor: '#000', marginTop: 8, paddingTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#000', fontSize: 13 }}>المجموع الفرعي:</Text>
                <Text style={{ color: '#000', fontSize: 13 }}>{formatMoney(viewing.subtotal, currency)}</Text>
              </View>
              {viewing.discount > 0 ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#000', fontSize: 13 }}>الخصم:</Text>
                  <Text style={{ color: '#000', fontSize: 13 }}>-{formatMoney(viewing.discount, currency)}</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: '#000', fontSize: 16, fontWeight: '800' }}>الإجمالي:</Text>
                <Text style={{ color: '#000', fontSize: 16, fontWeight: '800' }}>{formatMoney(viewing.total, currency)}</Text>
              </View>
            </View>
            <Text style={{ color: '#444', fontSize: 11, textAlign: 'center', marginTop: 12 }}>شكراً لزيارتكم 🙏</Text>
          </View>
        </ModalView>
      )}
    </View>
  )
}

// ============================================================
//  POS — نقطة البيع (إنشاء بون + مشاركة)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

import { COLORS, Card, PageHeader, Button, Input, Badge, ModalView } from '../components/ui'
import { formatMoney, formatDateTime, categoryLabel, CATEGORIES } from '../utils/format'
import { dbGetProducts, dbCreateReceipt, dbGetSettings, Product, Receipt, Settings } from '../db/database'

interface CartItem { product: Product; quantity: number; unitPrice: number }

export default function PosScreen({ settings }: { settings: Settings | null }) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [discount, setDiscount] = useState('0')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null)
  const currency = settings?.currency || 'دج'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await dbGetProducts(search, categoryFilter)
      setProducts(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [search, categoryFilter])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const addToCart = (p: Product) => {
    if (p.quantity <= 0) { Alert.alert('نفد', p.name); return }
    setCart((prev) => {
      const ex = prev.find((x) => x.product.id === p.id)
      if (ex) {
        if (ex.quantity >= p.quantity) { Alert.alert('حد المخزون', `متوفر: ${p.quantity}`); return prev }
        return prev.map((x) => (x.product.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))
      }
      return [...prev, { product: p, quantity: 1, unitPrice: p.salePrice }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((x) => {
      if (x.product.id !== id) return x
      const newQty = x.quantity + delta
      if (newQty > x.product.quantity) { Alert.alert('مخزون غير كافٍ'); return x }
      return { ...x, quantity: newQty }
    }).filter((x) => x.quantity > 0))
  }

  const setQty = (id: string, qty: number) => {
    setCart((prev) => prev.map((x) => {
      if (x.product.id !== id) return x
      if (qty > x.product.quantity) { Alert.alert('مخزون غير كافٍ'); return { ...x, quantity: x.product.quantity } }
      return { ...x, quantity: Math.max(1, qty) }
    }))
  }

  const setPrice = (id: string, price: number) => {
    setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, unitPrice: price } : x)))
  }

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((x) => x.product.id !== id))

  const subtotal = cart.reduce((s, x) => s + x.unitPrice * x.quantity, 0)
  const totalCost = cart.reduce((s, x) => s + x.product.purchasePrice * x.quantity, 0)
  const discountValue = Number(discount) || 0
  const total = Math.max(0, subtotal - discountValue)
  const totalProfit = total - totalCost

  const checkout = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const items = cart.map((x) => ({ productId: x.product.id, quantity: x.quantity, unitPrice: x.unitPrice }))
      const receipt = await dbCreateReceipt({ customerName, discount: discountValue, items })
      setLastReceipt(receipt)
      Alert.alert('تم', `تم إنشاء البون #${receipt.number}`)
      setCart([]); setCustomerName(''); setDiscount('0')
      load()
    } catch (e: any) {
      Alert.alert('خطأ', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const shareReceipt = async (receipt: Receipt) => {
    if (!receipt.items) return
    const storeName = settings?.storeName || 'Moto World 29'
    const itemsRows = receipt.items.map((i) => `
      <tr>
        <td>${i.productName}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:end">${formatMoney(i.unitPrice, currency)}</td>
        <td style="text-align:end">${formatMoney(i.total, currency)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
      * { font-family: Tahoma, sans-serif; box-sizing: border-box; }
      body { margin: 0; padding: 12px; color: #000; }
      .receipt { max-width: 320px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
      .store-name { font-size: 20px; font-weight: bold; }
      .store-sub { font-size: 11px; color: #444; }
      .info { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: start; border-bottom: 1px solid #000; padding: 4px; }
      td { padding: 4px; border-bottom: 1px dotted #ccc; }
      .totals { margin-top: 10px; font-size: 13px; }
      .totals div { display: flex; justify-content: space-between; padding: 2px 0; }
      .grand { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 6px; margin-top: 4px; }
      .footer { margin-top: 14px; text-align: center; font-size: 11px; color: #444; border-top: 2px dashed #000; padding-top: 8px; }
    </style></head><body>
      <div class="receipt">
        <div class="header">
          <div class="store-name">${storeName}</div>
          <div class="store-sub">قطع • إكسسوارات • معدات</div>
        </div>
        <div class="info"><span>بون #: <strong>${receipt.number}</strong></span><span>${formatDateTime(receipt.createdAt)}</span></div>
        ${receipt.customerName ? `<div class="info"><span>الزبون: <strong>${receipt.customerName}</strong></span></div>` : ''}
        <table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>${itemsRows}</tbody></table>
        <div class="totals">
          <div><span>المجموع الفرعي:</span><span>${formatMoney(receipt.subtotal, currency)}</span></div>
          ${receipt.discount > 0 ? `<div><span>الخصم:</span><span>-${formatMoney(receipt.discount, currency)}</span></div>` : ''}
          <div class="grand"><span>الإجمالي:</span><span>${formatMoney(receipt.total, currency)}</span></div>
        </div>
        <div class="footer">شكراً لزيارتكم<br>${storeName}</div>
      </div>
    </body></html>`

    try {
      const { uri } = await Print.printToFileAsync({ html })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `بون #${receipt.number}` })
      } else {
        Alert.alert('تم', 'تم إنشاء البون PDF')
      }
    } catch (e: any) {
      Alert.alert('خطأ', e.message)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <PageHeader title="نقطة البيع" subtitle="اختر القطع، أنشئ البون" />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Products list */}
        <View style={{ flex: 1.6 }}>
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
              borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8,
            }}>
              <Ionicons name="search" size={20} color={COLORS.red} style={{ marginRight: 8 }} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="ابحث..."
                placeholderTextColor={COLORS.textDim}
                style={{ flex: 1, color: COLORS.text, paddingVertical: 10, fontSize: 15, textAlign: 'right' }}
              />
            </View>
          </View>

          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            refreshing={loading}
            onRefresh={load}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            numColumns={2}
            renderItem={({ item }) => {
              const inCart = cart.find((x) => x.product.id === item.id)
              const isOut = item.quantity <= 0
              return (
                <TouchableOpacity
                  onPress={() => addToCart(item)}
                  disabled={isOut}
                  style={{
                    flex: 1, margin: 4, padding: 10, borderRadius: 10,
                    backgroundColor: inCart ? COLORS.redDark + '40' : COLORS.card,
                    borderWidth: 1, borderColor: inCart ? COLORS.red : COLORS.border,
                    opacity: isOut ? 0.4 : 1,
                  }}
                >
                  {inCart ? (
                    <View style={{ position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{inCart.quantity}</Text>
                    </View>
                  ) : null}
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 2 }}>{categoryLabel(item.category)}</Text>
                  <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '600', minHeight: 34 }} numberOfLines={2}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ color: COLORS.red, fontSize: 13, fontWeight: '700' }}>{formatMoney(item.salePrice, currency)}</Text>
                    <Badge color={isOut ? COLORS.red : item.quantity <= item.minQuantity ? COLORS.amber : COLORS.emerald}>{item.quantity}</Badge>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        </View>

        {/* Cart */}
        <View style={{ flex: 1, backgroundColor: COLORS.card, borderStartWidth: 1, borderStartColor: COLORS.border }}>
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="cart" size={18} color={COLORS.red} style={{ marginRight: 6 }} />
              <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>البون</Text>
              {cart.length > 0 ? <Badge color={COLORS.red}>{cart.length}</Badge> : null}
            </View>
            {cart.length > 0 ? (
              <TouchableOpacity onPress={() => setCart([])}>
                <Text style={{ color: COLORS.red, fontSize: 11 }}>تفريغ</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView style={{ flex: 1, padding: 8 }}>
            {cart.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="cart-outline" size={40} color={COLORS.textDim} />
                <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8 }}>السلة فارغة</Text>
              </View>
            ) : (
              cart.map((x) => (
                <View key={x.product.id} style={{ backgroundColor: COLORS.cardAlt, borderRadius: 8, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={2}>{x.product.name}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(x.product.id)}>
                      <Ionicons name="trash" size={16} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
                    <TouchableOpacity onPress={() => updateQty(x.product.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="remove" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TextInput
                      value={String(x.quantity)}
                      onChangeText={(t) => setQty(x.product.id, Number(t) || 1)}
                      keyboardType="decimal-pad"
                      style={{ width: 40, textAlign: 'center', color: COLORS.text, fontSize: 14, marginHorizontal: 4 }}
                    />
                    <TouchableOpacity onPress={() => updateQty(x.product.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="add" size={14} color="#fff" />
                    </TouchableOpacity>
                    <Text style={{ color: COLORS.textDim, fontSize: 10, marginRight: 8 }}>/{x.product.quantity}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginRight: 4 }}>السعر:</Text>
                    <TextInput
                      value={String(x.unitPrice)}
                      onChangeText={(t) => setPrice(x.product.id, Number(t) || 0)}
                      keyboardType="decimal-pad"
                      style={{ flex: 1, color: COLORS.text, fontSize: 13, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, padding: 4 }}
                    />
                  </View>
                  <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '700', textAlign: 'right', marginTop: 4 }}>{formatMoney(x.unitPrice * x.quantity, currency)}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {cart.length > 0 ? (
            <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <Input label="اسم الزبون (اختياري)" value={customerName} onChangeText={setCustomerName} placeholder="مثال: أحمد" />
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Input label={`خصم (${currency})`} value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>الإجمالي</Text>
                <Text style={{ color: COLORS.red, fontSize: 16, fontWeight: '700' }}>{formatMoney(total, currency)}</Text>
              </View>
              <Button title={submitting ? '...' : 'إنشاء البون ومشاركة'} onPress={checkout} disabled={submitting} style={{ marginTop: 8 }} icon="receipt" />
            </View>
          ) : null}
        </View>
      </View>

      {lastReceipt && (
        <ModalView
          visible={true}
          onClose={() => setLastReceipt(null)}
          title={`بون #${lastReceipt.number} ✓`}
          footer={
            <>
              <Button title="إغلاق" color={COLORS.textMuted} outline onPress={() => setLastReceipt(null)} style={{ flex: 1 }} />
              <Button title="مشاركة PDF" icon="share" onPress={() => shareReceipt(lastReceipt)} style={{ flex: 1 }} />
            </>
          }
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
            <Text style={{ color: '#000', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>{settings?.storeName || 'Moto World 29'}</Text>
            <Text style={{ color: '#444', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>قطع • إكسسوارات • معدات</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#000', fontSize: 12 }}>بون #: <Text style={{ fontWeight: '700' }}>{lastReceipt.number}</Text></Text>
              <Text style={{ color: '#444', fontSize: 11 }}>{formatDateTime(lastReceipt.createdAt)}</Text>
            </View>
            {lastReceipt.customerName ? <Text style={{ color: '#000', fontSize: 12, marginBottom: 8 }}>الزبون: {lastReceipt.customerName}</Text> : null}
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', paddingTop: 8, marginTop: 4 }}>
              {lastReceipt.items?.map((i) => (
                <View key={i.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                  <Text style={{ color: '#000', fontSize: 12, flex: 1 }}>{i.productName} ×{i.quantity}</Text>
                  <Text style={{ color: '#000', fontSize: 12 }}>{formatMoney(i.total, currency)}</Text>
                </View>
              ))}
            </View>
            <View style={{ borderTopWidth: 2, borderTopColor: '#000', marginTop: 8, paddingTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#000', fontSize: 13 }}>المجموع الفرعي:</Text>
                <Text style={{ color: '#000', fontSize: 13 }}>{formatMoney(lastReceipt.subtotal, currency)}</Text>
              </View>
              {lastReceipt.discount > 0 ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#000', fontSize: 13 }}>الخصم:</Text>
                  <Text style={{ color: '#000', fontSize: 13 }}>-{formatMoney(lastReceipt.discount, currency)}</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: '#000', fontSize: 16, fontWeight: '800' }}>الإجمالي:</Text>
                <Text style={{ color: '#000', fontSize: 16, fontWeight: '800' }}>{formatMoney(lastReceipt.total, currency)}</Text>
              </View>
            </View>
            <Text style={{ color: '#444', fontSize: 11, textAlign: 'center', marginTop: 12 }}>شكراً لزيارتكم 🙏</Text>
          </View>
        </ModalView>
      )}
    </View>
  )
}

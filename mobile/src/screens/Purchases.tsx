// ============================================================
//  Purchases — المشتريات (تزويد)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { COLORS, Card, PageHeader, Button, Input, Badge, ModalView } from '../components/ui'
import { formatMoney, formatDateTime, categoryLabel, CATEGORIES } from '../utils/format'
import { dbGetProducts, dbGetPurchases, dbCreatePurchase, dbDeletePurchase, Product, Purchase, Settings } from '../db/database'

interface RestockItem { product: Product; quantity: number; unitPrice: number }

export default function PurchasesScreen({ settings, onBack }: { settings: Settings | null; onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<RestockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const currency = settings?.currency || 'دج'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, pur] = await Promise.all([dbGetProducts(search), dbGetPurchases()])
      setProducts(p); setPurchases(pur)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const ex = prev.find((x) => x.product.id === p.id)
      if (ex) return prev.map((x) => (x.product.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))
      return [...prev, { product: p, quantity: 1, unitPrice: p.purchasePrice }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, quantity: Math.max(1, x.quantity + delta) } : x)))
  }
  const setQty = (id: string, qty: number) => setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, quantity: Math.max(1, qty) } : x)))
  const setPrice = (id: string, price: number) => setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, unitPrice: price } : x)))
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((x) => x.product.id !== id))

  const total = cart.reduce((s, x) => s + x.unitPrice * x.quantity, 0)

  const submit = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      for (const x of cart) {
        await dbCreatePurchase({ productId: x.product.id, quantity: x.quantity, unitPrice: x.unitPrice })
      }
      Alert.alert('تم', 'تم تسجيل الشراء')
      setCart([]); load()
    } catch (e: any) {
      Alert.alert('خطأ', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900' }}>المشتريات</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>تزويد المخزون</Text>
        </View>
        <Button title="قطعة جديدة" size="sm" color={COLORS.amber} icon="add-circle" outline onPress={() => setShowNew(true)} />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1.6 }}>
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
              borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8,
            }}>
              <Ionicons name="search" size={20} color={COLORS.amber} style={{ marginRight: 8 }} />
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
              return (
                <TouchableOpacity
                  onPress={() => addToCart(item)}
                  style={{
                    flex: 1, margin: 4, padding: 10, borderRadius: 10,
                    backgroundColor: inCart ? COLORS.amberDark + '40' : COLORS.card,
                    borderWidth: 1, borderColor: inCart ? COLORS.amber : COLORS.border,
                  }}
                >
                  {inCart ? (
                    <View style={{ position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.amber, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{inCart.quantity}</Text>
                    </View>
                  ) : null}
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 2 }}>{categoryLabel(item.category)}</Text>
                  <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '600', minHeight: 34 }} numberOfLines={2}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ color: COLORS.amber, fontSize: 13, fontWeight: '700' }}>{formatMoney(item.purchasePrice, currency)}</Text>
                    <Text style={{ color: COLORS.textDim, fontSize: 10 }}>مخزون: {item.quantity}</Text>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        </View>

        <View style={{ flex: 1, backgroundColor: COLORS.card, borderStartWidth: 1, borderStartColor: COLORS.border }}>
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="truck" size={18} color={COLORS.amber} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>التزويد</Text>
            {cart.length > 0 ? <Badge color={COLORS.amber}>{cart.length}</Badge> : null}
          </View>

          <ScrollView style={{ flex: 1, padding: 8 }}>
            {cart.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="truck-outline" size={40} color={COLORS.textDim} />
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
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginRight: 4 }}>سعر الشراء:</Text>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>إجمالي الشراء</Text>
                <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>{formatMoney(total, currency)}</Text>
              </View>
              <Button title={submitting ? '...' : 'تسجيل الشراء'} color={COLORS.amber} onPress={submit} disabled={submitting} icon="checkmark-circle" />
            </View>
          ) : null}
        </View>
      </View>

      {/* Recent purchases */}
      {purchases.length > 0 ? (
        <View style={{ maxHeight: 200, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: '700', padding: 12 }}>المشتريات الأخيرة</Text>
          <ScrollView style={{ maxHeight: 150 }}>
            {purchases.slice(0, 20).map((p) => (
              <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.text, fontSize: 12 }} numberOfLines={1}>{p.productName}</Text>
                  <Text style={{ color: COLORS.textDim, fontSize: 10 }}>{formatDateTime(p.createdAt)}</Text>
                </View>
                <Text style={{ color: COLORS.text, fontSize: 12 }}>{p.quantity} × {formatMoney(p.unitPrice, currency)}</Text>
                <TouchableOpacity onPress={async () => {
                  Alert.alert('حذف الشراء؟', '', [
                    { text: 'إلغاء' },
                    { text: 'حذف', style: 'destructive', onPress: async () => { await dbDeletePurchase(p.id); load() } },
                  ])
                }}>
                  <Ionicons name="trash" size={14} color={COLORS.red} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {showNew && (
        <NewProductPurchase currency={currency} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load() }} />
      )}
    </View>
  )
}

function NewProductPurchase({ currency, onClose, onSaved }: { currency: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('PIECES')
  const [sku, setSku] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'الاسم مطلوم'); return }
    setSaving(true)
    try {
      await dbCreatePurchase({
        name: name.trim(), category, sku: sku.trim(),
        unitPrice: Number(purchasePrice) || 0, salePrice: Number(salePrice) || 0,
        quantity: Number(quantity) || 1,
      })
      Alert.alert('تم', 'تم إنشاء القطعة وتسجيل الشراء')
      onSaved()
    } catch (e: any) {
      Alert.alert('خطأ', e.message)
    } finally { setSaving(false) }
  }

  return (
    <ModalView
      visible={true}
      onClose={onClose}
      title="قطعة جديدة + شراء"
      footer={
        <>
          <Button title="إلغاء" color={COLORS.textMuted} outline onPress={onClose} style={{ flex: 1 }} />
          <Button title={saving ? '...' : 'إنشاء + شراء'} color={COLORS.amber} onPress={save} disabled={saving} style={{ flex: 1 }} />
        </>
      }
    >
      <Input label="اسم المنتج *" value={name} onChangeText={setName} placeholder="مثال: فحمات CG125" />
      <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '600' }}>الفئة</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            onPress={() => setCategory(c.value)}
            style={{
              backgroundColor: category === c.value ? COLORS.amber : COLORS.cardAlt,
              borderWidth: 1, borderColor: category === c.value ? COLORS.amber : COLORS.border,
              borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 6, flex: 1, alignItems: 'center',
            }}
          >
            <Text style={{ color: category === c.value ? '#000' : COLORS.textMuted, fontSize: 13 }}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input label="الرمز (SKU)" value={sku} onChangeText={setSku} placeholder="اختياري" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input label={`سعر الشراء (${currency}) *`} value={purchasePrice} onChangeText={setPurchasePrice} placeholder="0" keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label={`سعر البيع (${currency})`} value={salePrice} onChangeText={setSalePrice} placeholder="0" keyboardType="decimal-pad" />
        </View>
      </View>
      <Input label="الكمية المشتراة" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
    </ModalView>
  )
}

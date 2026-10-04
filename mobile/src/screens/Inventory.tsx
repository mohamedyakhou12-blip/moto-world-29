// ============================================================
//  Inventory — المخزون
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { COLORS, Card, PageHeader, Button, Input, ModalView, Badge } from '../components/ui'
import { formatMoney, categoryLabel, CATEGORIES } from '../utils/format'
import { dbGetProducts, dbCreateProduct, dbUpdateProduct, dbDeleteProduct, Product, Settings } from '../db/database'

export default function InventoryScreen({ settings }: { settings: Settings | null }) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const currency = settings?.currency || 'دج'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await dbGetProducts(search, categoryFilter)
      setProducts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const totalValue = products.reduce((s, p) => s + p.purchasePrice * p.quantity, 0)

  const renderItem = ({ item }: { item: Product }) => {
    const margin = item.salePrice - item.purchasePrice
    const marginPct = item.salePrice > 0 ? (margin / item.salePrice) * 100 : 0
    const isLow = item.quantity <= item.minQuantity
    const isOut = item.quantity === 0
    return (
      <TouchableOpacity
        onPress={() => setEditing(item)}
        style={{ backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 8 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
            {item.sku ? <Text style={{ color: COLORS.textDim, fontSize: 11 }}>{item.sku}</Text> : null}
            <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>{categoryLabel(item.category)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Badge color={isOut ? COLORS.red : isLow ? COLORS.amber : COLORS.emerald}>{item.quantity}</Badge>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <View>
            <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>شراء</Text>
            <Text style={{ color: COLORS.text, fontSize: 13 }}>{formatMoney(item.purchasePrice, currency)}</Text>
          </View>
          <View>
            <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>بيع</Text>
            <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '700' }}>{formatMoney(item.salePrice, currency)}</Text>
          </View>
          <View>
            <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>هامش</Text>
            <Text style={{ color: COLORS.emerald, fontSize: 13, fontWeight: '700' }}>+{formatMoney(margin, currency)}</Text>
            <Text style={{ color: COLORS.textDim, fontSize: 10, textAlign: 'right' }}>{marginPct.toFixed(0)}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <PageHeader
          title="المخزون"
          subtitle={`${products.length} منتج • القيمة: ${formatMoney(totalValue, currency)}`}
          action={<Button title="منتج جديد" size="sm" icon="add" onPress={() => setCreating(true)} />}
        />

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
          borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8,
        }}>
          <Ionicons name="search" size={20} color={COLORS.red} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث بالاسم أو الرمز..."
            placeholderTextColor={COLORS.textDim}
            style={{ flex: 1, color: COLORS.text, paddingVertical: 10, fontSize: 16, textAlign: 'right' }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textDim} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
          {[{ value: 'ALL', label: 'الكل' }, ...CATEGORIES].map((c) => (
            <TouchableOpacity
              key={c.value}
              onPress={() => setCategoryFilter(c.value)}
              style={{
                backgroundColor: categoryFilter === c.value ? COLORS.red : COLORS.card,
                borderWidth: 1,
                borderColor: categoryFilter === c.value ? COLORS.red : COLORS.border,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 6,
                marginRight: 6,
              }}
            >
              <Text style={{ color: categoryFilter === c.value ? '#fff' : COLORS.textMuted, fontSize: 13, fontWeight: '600' }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textDim} />
            <Text style={{ color: COLORS.textMuted, marginTop: 8, fontSize: 14 }}>
              {search ? 'لا توجد نتائج' : 'لا توجد منتجات. أضف منتج جديد.'}
            </Text>
          </View>
        }
      />

      {(creating || editing) && (
        <ProductForm
          product={editing}
          currency={currency}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); load() }}
        />
      )}
    </View>
  )
}

// Horizontal ScrollView import
import { ScrollView } from 'react-native'

function ProductForm({ product, currency, onClose, onSaved }: { product: Product | null; currency: string; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!product
  const [name, setName] = useState(product?.name || '')
  const [category, setCategory] = useState(product?.category || 'PIECES')
  const [sku, setSku] = useState(product?.sku || '')
  const [purchasePrice, setPurchasePrice] = useState(String(product?.purchasePrice ?? ''))
  const [salePrice, setSalePrice] = useState(String(product?.salePrice ?? ''))
  const [quantity, setQuantity] = useState(String(product?.quantity ?? '0'))
  const [minQuantity, setMinQuantity] = useState(String(product?.minQuantity ?? '5'))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) { Alert.alert('خطأ', 'الاسم مطلوب'); return }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(), category, sku: sku.trim(),
        purchasePrice: Number(purchasePrice) || 0, salePrice: Number(salePrice) || 0,
        quantity: Number(quantity) || 0, minQuantity: Number(minQuantity) || 0,
      }
      if (isEdit) await dbUpdateProduct(product!.id, payload)
      else await dbCreateProduct(payload)
      Alert.alert('تم', isEdit ? 'تم تحديث المنتج' : 'تم إنشاء المنتج')
      onSaved()
    } catch (e: any) {
      Alert.alert('خطأ', e.message)
    } finally {
      setSaving(false)
    }
  }

  const del = () => {
    Alert.alert(
      'حذف المنتج؟',
      `سيتم حذف "${product?.name}". لا يمكن التراجع.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await dbDeleteProduct(product!.id)
              Alert.alert('تم', 'تم حذف المنتج')
              onSaved()
            } catch (e: any) {
              Alert.alert('خطأ', e.message)
            }
          },
        },
      ]
    )
  }

  const margin = (Number(salePrice) || 0) - (Number(purchasePrice) || 0)

  return (
    <ModalView
      visible={true}
      onClose={onClose}
      title={isEdit ? 'تعديل المنتج' : 'منتج جديد'}
      footer={
        <>
          {isEdit ? <Button title="حذف" color={COLORS.red} outline onPress={del} style={{ flex: 1 }} /> : null}
          <Button title="إلغاء" color={COLORS.textMuted} outline onPress={onClose} style={{ flex: 1 }} />
          <Button title={saving ? '...' : isEdit ? 'حفظ' : 'إنشاء'} onPress={save} disabled={saving} style={{ flex: 1 }} />
        </>
      }
    >
      <Input label="اسم المنتج *" value={name} onChangeText={setName} placeholder="مثال: فحمات فرامل" />

      <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '600' }}>الفئة</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            onPress={() => setCategory(c.value)}
            style={{
              backgroundColor: category === c.value ? COLORS.red : COLORS.cardAlt,
              borderWidth: 1, borderColor: category === c.value ? COLORS.red : COLORS.border,
              borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 6, flex: 1, alignItems: 'center',
            }}
          >
            <Text style={{ color: category === c.value ? '#fff' : COLORS.textMuted, fontSize: 13 }}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="الرمز (SKU)" value={sku} onChangeText={setSku} placeholder="مثال: BRK-001" />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input label={`سعر الشراء (${currency}) *`} value={purchasePrice} onChangeText={setPurchasePrice} placeholder="0" keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label={`سعر البيع (${currency}) *`} value={salePrice} onChangeText={setSalePrice} placeholder="0" keyboardType="decimal-pad" />
        </View>
      </View>

      <View style={{ backgroundColor: COLORS.emeraldDark + '40', borderWidth: 1, borderColor: COLORS.emeraldDark, borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>هامش الوحدة: </Text>
        <Text style={{ color: COLORS.emerald, fontSize: 16, fontWeight: '700' }}>{formatMoney(margin, currency)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Input label="الكمية" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="حد التنبيه" value={minQuantity} onChangeText={setMinQuantity} keyboardType="decimal-pad" />
        </View>
      </View>
    </ModalView>
  )
}

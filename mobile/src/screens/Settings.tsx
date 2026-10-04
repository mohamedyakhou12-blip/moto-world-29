// ============================================================
//  Settings — الإعدادات
// ============================================================

import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { COLORS, Card, PageHeader, Button, Input } from '../components/ui'
import { dbGetSettings, dbUpdateSettings, dbResetAll, dbSeedDemo, Settings } from '../db/database'

export default function SettingsScreen({ settings, setSettings, onBack }: { settings: Settings | null; setSettings: (s: Settings) => void; onBack: () => void }) {
  const [storeName, setStoreName] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName)
      setTaxRate(String(settings.taxRate))
    }
  }, [settings])

  const save = async () => {
    setSaving(true)
    try {
      const updated = await dbUpdateSettings({ storeName, taxRate: Number(taxRate) || 0 })
      setSettings(updated)
      Alert.alert('تم', 'تم حفظ الإعدادات')
    } catch (e: any) {
      Alert.alert('خطأ', e.message)
    } finally { setSaving(false) }
  }

  const loadDemo = () => {
    Alert.alert('تحميل بيانات تجريبية؟', 'سيُضاف ~8 منتجات نموذجية', [
      { text: 'إلغاء' },
      { text: 'تحميل', onPress: async () => {
        try {
          await dbSeedDemo()
          Alert.alert('تم', 'تم تحميل البيانات التجريبية')
        } catch (e: any) { Alert.alert('معلوم', e.message) }
      } },
    ])
  }

  const reset = () => {
    Alert.alert('حذف كل البيانات؟', 'لا يمكن التراجع!', [
      { text: 'إلغاء' },
      { text: 'حذف الكل', style: 'destructive', onPress: async () => {
        await dbResetAll()
        Alert.alert('تم', 'تم حذف كل البيانات')
      } },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900' }}>الإعدادات</Text>
      </View>

      <View style={{ padding: 16 }}>
        <Card style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="storefront" size={18} color={COLORS.red} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>معلومات المتجر</Text>
          </View>
          <Input label="اسم المتجر" value={storeName} onChangeText={setStoreName} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Input label="العملة" value="دج" onChangeText={() => {}} />
              <Text style={{ color: COLORS.textDim, fontSize: 10, marginTop: -6, marginBottom: 8 }}>الدينار الجزائري — عملة ثابتة</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Input label="الضريبة (%)" value={taxRate} onChangeText={setTaxRate} keyboardType="decimal-pad" />
            </View>
          </View>
          <Button title={saving ? '...' : 'حفظ'} onPress={save} disabled={saving} style={{ marginTop: 8 }} />
        </Card>

        <Card style={{ marginBottom: 12, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="image" size={18} color={COLORS.red} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>الشعار</Text>
          </View>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>M29</Text>
          </View>
          <Text style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 8 }}>موتو ورلد 29</Text>
        </Card>

        <Card style={{ marginBottom: 12, borderColor: COLORS.amber }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="cube" size={18} color={COLORS.amber} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '700' }}>بيانات تجريبية</Text>
          </View>
          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 8 }}>يضيف منتجات ومبيعات نموذجية لاختبار التطبيق</Text>
          <Button title="تحميل بيانات تجريبية" color={COLORS.amber} outline onPress={loadDemo} />
        </Card>

        <Card style={{ borderColor: COLORS.red }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="warning" size={18} color={COLORS.red} style={{ marginRight: 6 }} />
            <Text style={{ color: COLORS.red, fontSize: 14, fontWeight: '700' }}>إعادة تعيين</Text>
          </View>
          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 8 }}>حذف جميع المنتجات والمبيعات والمشتريات نهائياً</Text>
          <Button title="حذف كل البيانات" color={COLORS.red} outline onPress={reset} icon="trash" />
        </Card>

        <Text style={{ color: COLORS.textDim, fontSize: 10, textAlign: 'center', marginTop: 16 }}>موتو ورلد 29 — الإصدار 1.0 • البيانات محفوظة محلياً على هذا الهاتف</Text>
      </View>
    </View>
  )
}

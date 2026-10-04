// ============================================================
//  Moto World 29 - Mobile App (Android)
//  نفس نسخة الكمبيوتر — واجهة عربية RTL + دج
// ============================================================

import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { I18nManager, View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { initDatabase, dbGetSettings, Settings } from './src/db/database'
import { COLORS } from './src/components/ui'

import DashboardScreen from './src/screens/Dashboard'
import InventoryScreen from './src/screens/Inventory'
import PosScreen from './src/screens/POS'
import PurchasesScreen from './src/screens/Purchases'
import ReceiptsScreen from './src/screens/Receipts'
import ReportsScreen from './src/screens/Reports'
import SettingsScreen from './src/screens/Settings'

// Force RTL
I18nManager.forceRTL(true)
I18nManager.allowRTL(true)

const Tab = createBottomTabNavigator()

export default function App() {
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase()
        const s = await dbGetSettings()
        setSettings(s)
        setReady(true)
      } catch (e: any) {
        console.error('Init error:', e)
        setError(e.message)
      }
    }
    init()
  }, [])

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: 'red', fontSize: 16, marginBottom: 8 }}>خطأ في التشغيل</Text>
        <Text style={{ color: '#a3a3a3', fontSize: 13 }}>{error}</Text>
      </View>
    )
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.red} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>جارٍ التحميل...</Text>
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer
        theme={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: COLORS.bg,
            card: COLORS.card,
            text: COLORS.text,
            border: COLORS.border,
            primary: COLORS.red,
          },
        }}
      >
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: COLORS.red,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopColor: COLORS.border,
              paddingBottom: 4,
              height: 60,
            },
            headerStyle: {
              backgroundColor: COLORS.card,
              borderBottomColor: COLORS.border,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: '900',
              fontSize: 18,
            },
            headerTitleAlign: 'center',
          }}
        >
          <Tab.Screen
            name="Dashboard"
            options={{ title: 'الرئيسية', tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} /> }}
          >
            {() => <DashboardScreen settings={settings} />}
          </Tab.Screen>
          <Tab.Screen
            name="Inventory"
            options={{ title: 'المخزون', tabBarIcon: ({ color, size }) => <Ionicons name="cube" color={color} size={size} /> }}
          >
            {() => <InventoryScreen settings={settings} />}
          </Tab.Screen>
          <Tab.Screen
            name="POS"
            options={{ title: 'بيع', tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} /> }}
          >
            {() => <PosScreen settings={settings} />}
          </Tab.Screen>
          <Tab.Screen
            name="Receipts"
            options={{ title: 'البونات', tabBarIcon: ({ color, size }) => <Ionicons name="receipt" color={color} size={size} /> }}
          >
            {() => <ReceiptsScreen settings={settings} />}
          </Tab.Screen>
          <Tab.Screen
            name="More"
            options={{ title: 'المزيد', tabBarIcon: ({ color, size }) => <Ionicons name="menu" color={color} size={size} /> }}
          >
            {() => <MoreStack settings={settings} setSettings={setSettings} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </>
  )
}

// تبويب "المزيد" يحتوي على: مشتريات + تقارير + إعدادات
function MoreStack({ settings, setSettings }: { settings: Settings | null; setSettings: (s: Settings) => void }) {
  const [view, setView] = useState<'menu' | 'purchases' | 'reports' | 'settings'>('menu')

  if (view === 'purchases') return <PurchasesScreen settings={settings} onBack={() => setView('menu')} />
  if (view === 'reports') return <ReportsScreen settings={settings} onBack={() => setView('menu')} />
  if (view === 'settings') return <SettingsScreen settings={settings} setSettings={setSettings} onBack={() => setView('menu')} />

  // Menu
  const items = [
    { key: 'purchases', icon: 'truck', label: 'المشتريات', desc: 'تزويد المخزون', color: COLORS.amber },
    { key: 'reports', icon: 'bar-chart', label: 'التقارير', desc: 'يومي / شهري', color: COLORS.emerald },
    { key: 'settings', icon: 'settings', label: 'الإعدادات', desc: 'اسم المتجر + العملة', color: COLORS.sky },
  ]
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16 }}>
      <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: '900', marginBottom: 16 }}>المزيد</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item.key}
          onPress={() => setView(item.key as any)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: item.color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Ionicons name={item.icon as any} size={22} color={item.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: '700' }}>{item.label}</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
          </View>
          <Ionicons name="chevron-back" size={22} color={COLORS.textDim} />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
})

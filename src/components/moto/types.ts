'use client'

import { useEffect, useState, useCallback } from 'react'

export interface Product {
  id: string
  name: string
  category: string
  sku: string | null
  purchasePrice: number
  salePrice: number
  quantity: number
  minQuantity: number
  createdAt: string
  updatedAt: string
}

export interface ReceiptItem {
  id: string
  receiptId: string
  productId: string
  product?: Product
  productName: string
  quantity: number
  unitPrice: number
  unitCost: number
  total: number
  profit: number
}

export interface Receipt {
  id: string
  number: number
  customerName: string | null
  subtotal: number
  discount: number
  total: number
  profit: number
  itemCount: number
  note: string | null
  createdAt: string
  items?: ReceiptItem[]
}

export interface ReceiptWithItems extends Receipt {
  items: ReceiptItem[]
}

export interface PurchaseWithProduct {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  total: number
  note: string | null
  createdAt: string
}

export interface DashboardData {
  today: { revenue: number; cost: number; profit: number; count: number }
  month: { revenue: number; cost: number; profit: number; count: number }
  last7Days: Array<{ date: string; label: string; revenue: number; profit: number; cost: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number; profit: number }>
  lowStock: Product[]
  inventoryValue: number
  potentialRevenue: number
  totalProducts: number
}

export interface Settings {
  id: string
  storeName: string
  currency: string
  taxRate: number
  logoUrl: string | null
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = useCallback(async (patch: Partial<Settings>) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    setSettings(data)
    return data
  }, [])

  return { settings, loading, update, reload: load }
}

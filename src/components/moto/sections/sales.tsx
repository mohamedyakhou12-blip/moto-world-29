'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle2, Package, RefreshCw, History } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PageHeader } from '../app-shell'
import { CATEGORIES, categoryLabel, formatMoney, formatDateTime } from '@/lib/format'
import type { Product, SaleWithProduct, Settings } from '../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  settings: Settings | null
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
}

export function SalesSection({ settings }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [cart, setCart] = useState<CartItem[]>([])
  const [recent, setRecent] = useState<SaleWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const currency = settings?.currency || 'دج'
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = await res.json()
      setProducts(data)
    } catch {
      toast({ title: 'خطأ', description: 'تعذّر التحميل', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/sales', { cache: 'no-store' })
      const data = await res.json()
      setRecent(data.slice(0, 20))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadProducts()
    loadRecent()
  }, [loadProducts, loadRecent])

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter
    return matchSearch && matchCat
  })

  const addToCart = (p: Product) => {
    if (p.quantity <= 0) {
      toast({ title: 'نفد المخزون', description: p.name, variant: 'destructive' })
      return
    }
    setCart((prev) => {
      const ex = prev.find((x) => x.product.id === p.id)
      if (ex) {
        if (ex.quantity >= p.quantity) {
          toast({ title: 'الحد الأقصى للمخزون', description: `متوفر فقط ${p.quantity}`, variant: 'destructive' })
          return prev
        }
        return prev.map((x) => (x.product.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))
      }
      return [...prev, { product: p, quantity: 1, unitPrice: p.salePrice }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((x) => {
          if (x.product.id !== id) return x
          const newQty = x.quantity + delta
          if (newQty > x.product.quantity) {
            toast({ title: 'مخزون غير كافٍ', description: `الحد: ${x.product.quantity}`, variant: 'destructive' })
            return x
          }
          return { ...x, quantity: newQty }
        })
        .filter((x) => x.quantity > 0),
    )
  }

  const setQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((x) => {
        if (x.product.id !== id) return x
        if (qty > x.product.quantity) {
          toast({ title: 'مخزون غير كافٍ', variant: 'destructive' })
          return { ...x, quantity: x.product.quantity }
        }
        return { ...x, quantity: Math.max(1, qty) }
      }),
    )
  }

  const setPrice = (id: string, price: number) => {
    setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, unitPrice: price } : x)))
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((x) => x.product.id !== id))
  }

  const total = cart.reduce((s, x) => s + x.unitPrice * x.quantity, 0)
  const totalCost = cart.reduce((s, x) => s + x.product.purchasePrice * x.quantity, 0)
  const totalProfit = total - totalCost

  const checkout = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const items = cart.map((x) => ({
        productId: x.product.id,
        quantity: x.quantity,
        unitPrice: x.unitPrice,
      }))
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'فشل البيع')
      }
      toast({
        title: 'تم تسجيل البيع ✓',
        description: `المجموع: ${formatMoney(total, currency)} • الربح: ${formatMoney(totalProfit, currency)}`,
      })
      setCart([])
      loadProducts()
      loadRecent()
    } catch (e) {
      toast({ title: 'خطأ', description: e instanceof Error ? e.message : 'فشل', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="المبيعات"
        subtitle="اختر القطع المباعة، اضبط الكميات، ثم سجّل عملية البيع."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
              <History className="h-4 w-4 me-2" />
              السجل
            </Button>
            <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
              <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Product picker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="ابحث عن قطعة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-52 bg-neutral-900 border-neutral-800 text-white">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="ALL">الكل</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto ps-1">
            {loading && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                <Package className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                جارٍ التحميل...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                لا توجد منتجات مطابقة.
              </div>
            )}
            {filtered.map((p) => {
              const inCart = cart.find((x) => x.product.id === p.id)
              const isOut = p.quantity <= 0
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={isOut}
                  className={`text-start p-3 rounded-xl border transition-all relative ${
                    inCart
                      ? 'border-red-600 bg-red-950/30'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                  } ${isOut ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {inCart && (
                    <div className="absolute top-2 end-2 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                      {inCart.quantity}
                    </div>
                  )}
                  <div className="text-xs text-neutral-400 mb-1">{categoryLabel(p.category)}</div>
                  <div className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5rem]">
                    {p.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-red-400">{formatMoney(p.salePrice, currency)}</div>
                    <Badge variant="outline" className={`text-[10px] ${
                      isOut ? 'border-red-600 text-red-400' :
                      p.quantity <= p.minQuantity ? 'border-amber-600 text-amber-400' :
                      'border-emerald-700 text-emerald-400'
                    }`}>
                      {p.quantity}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cart */}
        <Card className="bg-neutral-900 border-neutral-800 p-4 lg:sticky lg:top-4 h-fit">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-red-400" />
              <h3 className="font-bold text-white">السلة</h3>
              {cart.length > 0 && (
                <Badge className="bg-red-600 text-white">{cart.length}</Badge>
              )}
            </div>
            {cart.length > 0 && (
              <Button size="sm" variant="ghost" className="text-xs text-neutral-400 hover:text-red-400" onClick={() => setCart([])}>
                تفريغ
              </Button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">السلة فارغة</p>
              <p className="text-xs mt-1">اضغط على منتج لإضافته</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[45vh] overflow-y-auto ps-1">
              {cart.map((x) => (
                <div key={x.product.id} className="bg-neutral-950/60 rounded-lg p-3 border border-neutral-800">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-white leading-tight">{x.product.name}</div>
                    <button onClick={() => removeFromCart(x.product.id)} className="text-neutral-500 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" onClick={() => updateQty(x.product.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={x.quantity}
                      onChange={(e) => setQty(x.product.id, Number(e.target.value))}
                      className="h-7 w-14 text-center bg-neutral-900 border-neutral-700 text-white px-1"
                    />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" onClick={() => updateQty(x.product.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <div className="flex-1" />
                    <span className="text-xs text-neutral-500">/{x.product.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">السعر:</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={x.unitPrice}
                      onChange={(e) => setPrice(x.product.id, Number(e.target.value))}
                      className="h-7 flex-1 bg-neutral-900 border-neutral-700 text-white px-2 text-sm"
                    />
                  </div>
                  <div className="mt-2 text-end text-sm font-bold text-white">
                    {formatMoney(x.unitPrice * x.quantity, currency)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">رقم المعاملات</span>
                <span className="text-white font-semibold">{formatMoney(total, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">تكلفة البضاعة</span>
                <span className="text-neutral-300">{formatMoney(totalCost, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">صافي الربح</span>
                <span className="text-emerald-400 font-bold">{formatMoney(totalProfit, currency)}</span>
              </div>
              <Button
                onClick={checkout}
                disabled={submitting}
                className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-3"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                    جارٍ التسجيل...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 me-2" />
                    تأكيد البيع
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Recent sales */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-white mb-3">المبيعات الأخيرة</h3>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm bg-neutral-900 rounded-lg border border-neutral-800">
            لا توجد مبيعات حتى الآن
          </div>
        ) : (
          <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-950/50 border-b border-neutral-800 sticky top-0">
                  <tr className="text-neutral-400">
                    <th className="px-4 py-2 font-semibold text-start">التاريخ</th>
                    <th className="px-4 py-2 font-semibold text-start">المنتج</th>
                    <th className="px-4 py-2 font-semibold text-center">الكمية</th>
                    <th className="px-4 py-2 font-semibold text-end">السعر</th>
                    <th className="px-4 py-2 font-semibold text-end">المجموع</th>
                    <th className="px-4 py-2 font-semibold text-end">الربح</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30">
                      <td className="px-4 py-2 text-xs text-neutral-400">{formatDateTime(s.createdAt)}</td>
                      <td className="px-4 py-2 text-white">{s.product.name}</td>
                      <td className="px-4 py-2 text-center text-neutral-300">{s.quantity}</td>
                      <td className="px-4 py-2 text-end text-neutral-300">{formatMoney(s.unitPrice, currency)}</td>
                      <td className="px-4 py-2 text-end font-semibold text-white">{formatMoney(s.total, currency)}</td>
                      <td className="px-4 py-2 text-end text-emerald-400 font-semibold">{formatMoney(s.profit, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* History dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>سجل المبيعات</DialogTitle>
            <DialogDescription className="text-neutral-400">
              آخر {recent.length} عملية بيع. يمكنك إلغاء عملية لإعادة المخزون.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">لا توجد مبيعات</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-neutral-950/50 border-b border-neutral-800 sticky top-0">
                  <tr className="text-neutral-400">
                    <th className="px-3 py-2 font-semibold text-start">التاريخ</th>
                    <th className="px-3 py-2 font-semibold text-start">المنتج</th>
                    <th className="px-3 py-2 font-semibold text-center">الكمية</th>
                    <th className="px-3 py-2 font-semibold text-end">المجموع</th>
                    <th className="px-3 py-2 font-semibold text-end">الربح</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id} className="border-b border-neutral-800/60">
                      <td className="px-3 py-2 text-xs text-neutral-400">{formatDateTime(s.createdAt)}</td>
                      <td className="px-3 py-2 text-white">{s.product.name}</td>
                      <td className="px-3 py-2 text-center text-neutral-300">{s.quantity}</td>
                      <td className="px-3 py-2 text-end font-semibold text-white">{formatMoney(s.total, currency)}</td>
                      <td className="px-3 py-2 text-end text-emerald-400">{formatMoney(s.profit, currency)}</td>
                      <td className="px-3 py-2 text-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-950/40"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/sales?id=${s.id}`, { method: 'DELETE' })
                              if (!res.ok) throw new Error('Échec')
                              toast({ title: 'تم إلغاء البيع', description: 'أُعيد المخزون' })
                              loadProducts()
                              loadRecent()
                            } catch {
                              toast({ title: 'خطأ', description: 'تعذّر الإلغاء', variant: 'destructive' })
                            }
                          }}
                        >
                          إلغاء
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

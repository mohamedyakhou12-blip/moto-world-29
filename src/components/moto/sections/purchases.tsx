'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Truck, Plus, Minus, CheckCircle2, Package, RefreshCw, Trash2, X, PackagePlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '../app-shell'
import { CATEGORIES, categoryLabel, formatMoney, formatDateTime } from '@/lib/format'
import type { Product, PurchaseWithProduct, Settings } from '../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  settings: Settings | null
}

interface RestockItem {
  product: Product
  quantity: number
  unitPrice: number
}

export function PurchasesSection({ settings }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [recent, setRecent] = useState<PurchaseWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cart, setCart] = useState<RestockItem[]>([])
  const [showNewProduct, setShowNewProduct] = useState(false)
  const currency = settings?.currency || 'دج'
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter)
      const res = await fetch(`/api/products?${params}`, { cache: 'no-store' })
      const data = await res.json()
      setProducts(data)
    } catch {
      toast({ title: 'خطأ', description: 'تعذّر التحميل', variant: 'destructive' })
    } finally { setLoading(false) }
  }, [toast, search, categoryFilter])

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/purchases', { cache: 'no-store' })
      const data = await res.json()
      setRecent(data.slice(0, 20))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const t = setTimeout(loadProducts, 250)
    return () => clearTimeout(t)
  }, [loadProducts])

  useEffect(() => { loadRecent() }, [loadRecent])

  const filtered = products

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const ex = prev.find((x) => x.product.id === p.id)
      if (ex) return prev.map((x) => (x.product.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))
      return [...prev, { product: p, quantity: 1, unitPrice: p.purchasePrice }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, quantity: Math.max(1, x.quantity + delta) } : x)).filter((x) => x.quantity > 0))
  }
  const setQty = (id: string, qty: number) => {
    setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, quantity: Math.max(1, qty) } : x)))
  }
  const setPrice = (id: string, price: number) => {
    setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, unitPrice: price } : x)))
  }
  const removeFromCart = (id: string) => setCart((prev) => prev.filter((x) => x.product.id !== id))

  const total = cart.reduce((s, x) => s + x.unitPrice * x.quantity, 0)

  const submit = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const items = cart.map((x) => ({ productId: x.product.id, quantity: x.quantity, unitPrice: x.unitPrice }))
      const res = await fetch('/api/purchases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'فشل') }
      toast({ title: 'تم تسجيل الشراء ✓', description: `تحديث المخزون • المجموع: ${formatMoney(total, currency)}` })
      setCart([]); loadProducts(); loadRecent()
    } catch (e) {
      toast({ title: 'خطأ', description: e instanceof Error ? e.message : 'فشل', variant: 'destructive' })
    } finally { setSubmitting(false) }
  }

  return (
    <div>
      <PageHeader
        title="المشتريات / التزويد"
        subtitle="اختر قطعة موجودة لزيادتها، أو أضف قطعة جديدة مباشرة. المخزون وسعر الشراء يتحدثان تلقائياً."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewProduct(true)} className="border-emerald-700 text-emerald-400 hover:bg-emerald-950/40">
              <PackagePlus className="h-4 w-4 me-2" /> قطعة جديدة بالشراء
            </Button>
            <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
              <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-4 text-amber-400" />
              <Input
                placeholder="🔍 ابحث عن قطعة موجودة لتزويدها..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10 pe-9 h-12 text-base bg-neutral-900 border-neutral-700 focus:border-amber-600 text-white placeholder:text-neutral-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-52 h-12 bg-neutral-900 border-neutral-700 text-white">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="ALL">الكل</SelectItem>
                {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto ps-1">
            {loading && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                <Package className="h-8 w-8 mx-auto mb-2 animate-pulse" /> جارٍ التحميل...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                {search ? 'لا توجد نتائج' : 'لا توجد منتجات. استخدم "قطعة جديدة بالشراء".'}
              </div>
            )}
            {filtered.map((p) => {
              const inCart = cart.find((x) => x.product.id === p.id)
              return (
                <button
                  key={p.id} onClick={() => addToCart(p)}
                  className={`text-start p-3 rounded-xl border transition-all relative ${inCart ? 'border-amber-600 bg-amber-950/30' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'}`}
                >
                  {inCart && <div className="absolute top-2 end-2 h-5 w-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">{inCart.quantity}</div>}
                  <div className="text-xs text-neutral-400 mb-1">{categoryLabel(p.category)}</div>
                  <div className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5rem]">{p.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-amber-400">{formatMoney(p.purchasePrice, currency)}</div>
                    <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-300">مخزون: {p.quantity}</Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800 p-4 lg:sticky lg:top-4 h-fit">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white">التزويد</h3>
              {cart.length > 0 && <Badge className="bg-amber-600 text-white">{cart.length}</Badge>}
            </div>
            {cart.length > 0 && <Button size="sm" variant="ghost" className="text-xs text-neutral-400 hover:text-red-400" onClick={() => setCart([])}>تفريغ</Button>}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <Truck className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">السلة فارغة</p>
              <p className="text-xs mt-1">اضغط على قطعة موجودة لتزويدها</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[40vh] overflow-y-auto ps-1">
              {cart.map((x) => (
                <div key={x.product.id} className="bg-neutral-950/60 rounded-lg p-3 border border-neutral-800">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-white leading-tight">{x.product.name}</div>
                    <button onClick={() => removeFromCart(x.product.id)} className="text-neutral-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" onClick={() => updateQty(x.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                    <Input type="number" value={x.quantity} onChange={(e) => setQty(x.product.id, Number(e.target.value))} className="h-7 w-14 text-center bg-neutral-900 border-neutral-700 text-white px-1" />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" onClick={() => updateQty(x.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">سعر الشراء:</span>
                    <Input type="number" step="0.01" value={x.unitPrice} onChange={(e) => setPrice(x.product.id, Number(e.target.value))} className="h-7 flex-1 bg-neutral-900 border-neutral-700 text-white px-2 text-sm" />
                  </div>
                  <div className="mt-2 text-end text-sm font-bold text-white">{formatMoney(x.unitPrice * x.quantity, currency)}</div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">إجمالي الشراء</span>
                <span className="text-white font-bold">{formatMoney(total, currency)}</span>
              </div>
              <Button onClick={submit} disabled={submitting} className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3">
                {submitting ? (<><RefreshCw className="h-4 w-4 me-2 animate-spin" /> جارٍ التسجيل...</>) : (<><CheckCircle2 className="h-4 w-4 me-2" /> تسجيل الشراء</>)}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-white mb-3">المشتريات الأخيرة</h3>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm bg-neutral-900 rounded-lg border border-neutral-800">لا توجد مشتريات مسجلة</div>
        ) : (
          <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-950/50 border-b border-neutral-800 sticky top-0">
                  <tr className="text-neutral-400">
                    <th className="px-4 py-2 font-semibold text-start">التاريخ</th>
                    <th className="px-4 py-2 font-semibold text-start">المنتج</th>
                    <th className="px-4 py-2 font-semibold text-center">الكمية</th>
                    <th className="px-4 py-2 font-semibold text-end">سعر الوحدة</th>
                    <th className="px-4 py-2 font-semibold text-end">الإجمالي</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30">
                      <td className="px-4 py-2 text-xs text-neutral-400">{formatDateTime(p.createdAt)}</td>
                      <td className="px-4 py-2 text-white">{p.product.name}</td>
                      <td className="px-4 py-2 text-center text-neutral-300">{p.quantity}</td>
                      <td className="px-4 py-2 text-end text-neutral-300">{formatMoney(p.unitPrice, currency)}</td>
                      <td className="px-4 py-2 text-end font-semibold text-white">{formatMoney(p.total, currency)}</td>
                      <td className="px-4 py-2 text-end">
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-950/40"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/purchases?id=${p.id}`, { method: 'DELETE' })
                              if (!res.ok) throw new Error('فشل')
                              toast({ title: 'تم حذف الشراء', description: 'تم تعديل المخزون' })
                              loadProducts(); loadRecent()
                            } catch { toast({ title: 'خطأ', description: 'تعذّر الحذف', variant: 'destructive' }) }
                          }}
                        >إلغاء</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {showNewProduct && (
        <NewProductPurchaseDialog
          currency={currency}
          onClose={() => setShowNewProduct(false)}
          onSaved={() => { setShowNewProduct(false); loadProducts(); loadRecent() }}
        />
      )}
    </div>
  )
}

// Add a new product + record its purchase in one step
function NewProductPurchaseDialog({ currency, onClose, onSaved }: { currency: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('PIECES')
  const [sku, setSku] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const submit = async () => {
    if (!name.trim()) { toast({ title: 'الاسم مطلوب', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            name: name.trim(),
            category,
            sku: sku.trim(),
            unitPrice: Number(purchasePrice) || 0,
            salePrice: Number(salePrice) || 0,
            quantity: Number(quantity) || 1,
          }],
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'فشل') }
      toast({ title: 'تم إنشاء القطعة وتسجيل الشراء ✓', description: name })
      onSaved()
    } catch (e) {
      toast({ title: 'خطأ', description: e instanceof Error ? e.message : 'فشل', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>قطعة جديدة + تسجيل الشراء</DialogTitle>
          <DialogDescription className="text-neutral-400">
            أنشئ قطعة جديدة وسجّل شراءها دفعة واحدة. ستُضاف للمخزون تلقائياً.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto ps-1">
          <div>
            <Label htmlFor="np-name">اسم المنتج *</Label>
            <Input id="np-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فحمات فرامل CG125" className="bg-neutral-950 border-neutral-800 text-white mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="np-cat">الفئة</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="np-cat" className="bg-neutral-950 border-neutral-800 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="np-sku">الرمز (SKU)</Label>
              <Input id="np-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="اختياري" className="bg-neutral-950 border-neutral-800 text-white mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="np-pp">سعر الشراء ({currency}) *</Label>
              <Input id="np-pp" type="number" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" className="bg-neutral-950 border-neutral-800 text-white mt-1" />
            </div>
            <div>
              <Label htmlFor="np-sp">سعر البيع ({currency})</Label>
              <Input id="np-sp" type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" className="bg-neutral-950 border-neutral-800 text-white mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="np-qty">الكمية المشتراة</Label>
            <Input id="np-qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-neutral-950 border-neutral-800 text-white mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">إلغاء</Button>
          <Button onClick={submit} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
            {saving ? 'جارٍ الحفظ...' : 'إنشاء + تسجيل الشراء'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

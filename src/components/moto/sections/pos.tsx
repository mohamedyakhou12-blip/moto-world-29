'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle2, Package, RefreshCw, Printer, X, User } from 'lucide-react'
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
import type { Product, Receipt, Settings } from '../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  settings: Settings | null
  onComplete?: () => void
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
}

export function PosSection({ settings }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [discount, setDiscount] = useState('0')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null)
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

  useEffect(() => {
    const t = setTimeout(loadProducts, 250)
    return () => clearTimeout(t)
  }, [loadProducts])

  const filtered = products

  const addToCart = (p: Product) => {
    if (p.quantity <= 0) { toast({ title: 'نفد المخزون', description: p.name, variant: 'destructive' }); return }
    setCart((prev) => {
      const ex = prev.find((x) => x.product.id === p.id)
      if (ex) {
        if (ex.quantity >= p.quantity) { toast({ title: 'الحد الأقصى للمخزون', description: `متوفر فقط ${p.quantity}`, variant: 'destructive' }); return prev }
        return prev.map((x) => (x.product.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))
      }
      return [...prev, { product: p, quantity: 1, unitPrice: p.salePrice }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((x) => {
      if (x.product.id !== id) return x
      const newQty = x.quantity + delta
      if (newQty > x.product.quantity) { toast({ title: 'مخزون غير كافٍ', description: `الحد: ${x.product.quantity}`, variant: 'destructive' }); return x }
      return { ...x, quantity: newQty }
    }).filter((x) => x.quantity > 0))
  }

  const setQty = (id: string, qty: number) => {
    setCart((prev) => prev.map((x) => {
      if (x.product.id !== id) return x
      if (qty > x.product.quantity) { toast({ title: 'مخزون غير كافٍ', variant: 'destructive' }); return { ...x, quantity: x.product.quantity } }
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
      const res = await fetch('/api/receipts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, discount: discountValue, items }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'فشل') }
      const receipt = await res.json()
      setLastReceipt(receipt)
      toast({ title: `تم إنشاء البون #${receipt.number} ✓`, description: `المجموع: ${formatMoney(receipt.total, currency)}` })
      setCart([]); setCustomerName(''); setDiscount('0')
      loadProducts()
    } catch (e) {
      toast({ title: 'خطأ', description: e instanceof Error ? e.message : 'فشل', variant: 'destructive' })
    } finally { setSubmitting(false) }
  }

  return (
    <div>
      <PageHeader
        title="نقطة البيع"
        subtitle="اختر القطع، اضبط الكميات، ثم أنشئ البون للزبون."
        action={
          <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} /> تحديث
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Product picker */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-4 text-red-400" />
              <Input
                placeholder="🔍 ابحث عن قطعة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10 pe-9 h-12 text-base bg-neutral-900 border-neutral-700 focus:border-red-600 text-white placeholder:text-neutral-500"
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
              <div className="col-span-full text-center py-12 text-neutral-500">لا توجد منتجات مطابقة.</div>
            )}
            {filtered.map((p) => {
              const inCart = cart.find((x) => x.product.id === p.id)
              const isOut = p.quantity <= 0
              return (
                <button
                  key={p.id} onClick={() => addToCart(p)} disabled={isOut}
                  className={`text-start p-3 rounded-xl border transition-all relative ${inCart ? 'border-red-600 bg-red-950/30' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'} ${isOut ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {inCart && (
                    <div className="absolute top-2 end-2 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">{inCart.quantity}</div>
                  )}
                  <div className="text-xs text-neutral-400 mb-1">{categoryLabel(p.category)}</div>
                  <div className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5rem]">{p.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-red-400">{formatMoney(p.salePrice, currency)}</div>
                    <Badge variant="outline" className={`text-[10px] ${isOut ? 'border-red-600 text-red-400' : p.quantity <= p.minQuantity ? 'border-amber-600 text-amber-400' : 'border-emerald-700 text-emerald-400'}`}>{p.quantity}</Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cart */}
        <Card className="bg-neutral-900 border-neutral-800 p-4 lg:sticky lg:top-4 h-fit">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-red-400" />
              <h3 className="font-bold text-white">البون الحالي</h3>
              {cart.length > 0 && <Badge className="bg-red-600 text-white">{cart.length}</Badge>}
            </div>
            {cart.length > 0 && <Button size="sm" variant="ghost" className="text-xs text-neutral-400 hover:text-red-400" onClick={() => setCart([])}>تفريغ</Button>}
          </div>

          {/* Customer name */}
          <div className="mb-3">
            <Label htmlFor="cust" className="text-xs text-neutral-400 flex items-center gap-1.5"><User className="h-3 w-3" /> اسم الزبون (اختياري)</Label>
            <Input id="cust" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="مثال: أحمد" className="bg-neutral-950 border-neutral-800 text-white mt-1 h-9" />
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">السلة فارغة</p>
              <p className="text-xs mt-1">اضغط على منتج لإضافته</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[35vh] overflow-y-auto ps-1">
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
                    <div className="flex-1" />
                    <span className="text-xs text-neutral-500">/{x.product.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">السعر:</span>
                    <Input type="number" step="0.01" value={x.unitPrice} onChange={(e) => setPrice(x.product.id, Number(e.target.value))} className="h-7 flex-1 bg-neutral-900 border-neutral-700 text-white px-2 text-sm" />
                  </div>
                  <div className="mt-2 text-end text-sm font-bold text-white">{formatMoney(x.unitPrice * x.quantity, currency)}</div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="disc" className="text-xs text-neutral-400 whitespace-nowrap">خصم ({currency})</Label>
                <Input id="disc" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="h-8 bg-neutral-950 border-neutral-800 text-white px-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">المجموع الفرعي</span>
                <span className="text-white">{formatMoney(subtotal, currency)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">الخصم</span>
                  <span className="text-red-400">-{formatMoney(discountValue, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <span className="text-white">الإجمالي</span>
                <span className="text-red-400">{formatMoney(total, currency)}</span>
              </div>
              <Button onClick={checkout} disabled={submitting} className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3">
                {submitting ? (<><RefreshCw className="h-4 w-4 me-2 animate-spin" /> جارٍ الإنشاء...</>) : (<><CheckCircle2 className="h-4 w-4 me-2" /> إنشاء البون وطباعته</>)}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Receipt print dialog */}
      {lastReceipt && (
        <ReceiptPrintDialog receipt={lastReceipt} settings={settings} onClose={() => setLastReceipt(null)} />
      )}
    </div>
  )
}

// ============================================================
// نافذة طباعة البون
// Receipt print dialog
// ============================================================
function ReceiptPrintDialog({ receipt, settings, onClose }: { receipt: Receipt; settings: Settings | null; onClose: () => void }) {
  const currency = settings?.currency || 'دج'
  const storeName = settings?.storeName || 'موتو ورلد 29'

  const handlePrint = () => {
    const printContents = document.getElementById('receipt-print-area')?.innerHTML
    if (!printContents) return
    const w = window.open('', '_blank', 'width=400,height=600')
    if (!w) return
    w.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>بون #${receipt.number}</title>
        <style>
          * { font-family: 'Segoe UI', Tahoma, sans-serif; box-sizing: border-box; }
          body { margin: 0; padding: 12px; color: #000; background: #fff; }
          .receipt { max-width: 320px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .store-name { font-size: 20px; font-weight: bold; }
          .store-sub { font-size: 11px; color: #444; }
          .receipt-info { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
          .customer { font-size: 12px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: start; border-bottom: 1px solid #000; padding: 4px 2px; }
          td { padding: 4px 2px; border-bottom: 1px dotted #ccc; }
          .qty { text-align: center; }
          .price { text-align: end; }
          .totals { margin-top: 10px; font-size: 13px; }
          .totals div { display: flex; justify-content: space-between; padding: 2px 0; }
          .grand { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 6px; margin-top: 4px; }
          .footer { margin-top: 14px; text-align: center; font-size: 11px; color: #444; border-top: 2px dashed #000; padding-top: 8px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${printContents}</body>
      </html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white text-black max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-emerald-700">✓ تم إنشاء البون #{receipt.number}</DialogTitle>
          <DialogDescription className="text-center text-neutral-600">يمكنك طباعة البون الآن</DialogDescription>
        </DialogHeader>

        <div id="receipt-print-area">
          <div className="receipt">
            <div className="header">
              <div className="store-name">{storeName}</div>
              <div className="store-sub">قطع • إكسسوارات • معدات الدراجات النارية</div>
            </div>
            <div className="receipt-info">
              <span>بون #: <strong>{receipt.number}</strong></span>
              <span>{formatDateTime(receipt.createdAt)}</span>
            </div>
            {receipt.customerName && (
              <div className="customer">الزبون: <strong>{receipt.customerName}</strong></div>
            )}
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th className="qty">الكمية</th>
                  <th className="price">السعر</th>
                  <th className="price">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td className="qty">{item.quantity}</td>
                    <td className="price">{formatMoney(item.unitPrice, currency)}</td>
                    <td className="price">{formatMoney(item.total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="totals">
              <div><span>المجموع الفرعي:</span><span>{formatMoney(receipt.subtotal, currency)}</span></div>
              {receipt.discount > 0 && <div><span>الخصم:</span><span>-{formatMoney(receipt.discount, currency)}</span></div>}
              <div className="grand"><span>الإجمالي:</span><span>{formatMoney(receipt.total, currency)}</span></div>
            </div>
            <div className="footer">
              شكراً لزيارتكم 🙏<br />
              {storeName}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="bg-neutral-100 border-neutral-300 text-black hover:bg-neutral-200">إغلاق</Button>
          <Button onClick={handlePrint} className="bg-red-600 hover:bg-red-700 text-white">
            <Printer className="h-4 w-4 me-2" /> طباعة البون
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

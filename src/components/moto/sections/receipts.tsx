'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Printer, Trash2, RefreshCw, Receipt as ReceiptIcon, X, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader } from '../app-shell'
import { formatMoney, formatDateTime } from '@/lib/format'
import type { Receipt, ReceiptWithItems, Settings } from '../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  settings: Settings | null
}

export function ReceiptsSection({ settings }: Props) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<ReceiptWithItems | null>(null)
  const [deleting, setDeleting] = useState<Receipt | null>(null)
  const currency = settings?.currency || 'دج'
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/receipts?limit=200', { cache: 'no-store' })
      const data = await res.json()
      setReceipts(data)
    } catch {
      toast({ title: 'خطأ', description: 'تعذّر التحميل', variant: 'destructive' })
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  const filtered = receipts.filter((r) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      String(r.number).includes(s) ||
      (r.customerName || '').toLowerCase().includes(s)
    )
  })

  const totalRevenue = filtered.reduce((s, r) => s + r.total, 0)
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0)

  const viewReceipt = async (id: string) => {
    try {
      const res = await fetch(`/api/receipts/${id}`, { cache: 'no-store' })
      const data = await res.json()
      setViewing(data)
    } catch {
      toast({ title: 'خطأ', description: 'تعذّر فتح البون', variant: 'destructive' })
    }
  }

  return (
    <div>
      <PageHeader
        title="سجل البونات"
        subtitle={`${receipts.length} بون • الإيراد: ${formatMoney(totalRevenue, currency)} • الربح: ${formatMoney(totalProfit, currency)}`}
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} /> تحديث
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-4 text-red-400" />
        <Input
          placeholder="🔍 ابحث برقم البون أو اسم الزبون..."
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

      <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950/50 border-b border-neutral-800 sticky top-0">
              <tr className="text-neutral-400">
                <th className="px-4 py-3 font-semibold text-start">#</th>
                <th className="px-4 py-3 font-semibold text-start">التاريخ</th>
                <th className="px-4 py-3 font-semibold text-start">الزبون</th>
                <th className="px-4 py-3 font-semibold text-center">القطع</th>
                <th className="px-4 py-3 font-semibold text-end">الإجمالي</th>
                <th className="px-4 py-3 font-semibold text-end">الربح</th>
                <th className="px-4 py-3 font-semibold text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                  <ReceiptIcon className="h-8 w-8 mx-auto mb-2 animate-pulse" /> جارٍ التحميل...
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                  <ReceiptIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {search ? 'لا توجد نتائج' : 'لا توجد بونات بعد. ابدأ البيع من "نقطة البيع".'}
                </td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30 cursor-pointer" onClick={() => viewReceipt(r.id)}>
                  <td className="px-4 py-3"><Badge className="bg-red-600/20 text-red-300 border border-red-700/40">#{r.number}</Badge></td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-white">{r.customerName || <span className="text-neutral-500">—</span>}</td>
                  <td className="px-4 py-3 text-center text-neutral-300">{r.itemCount}</td>
                  <td className="px-4 py-3 text-end font-bold text-white">{formatMoney(r.total, currency)}</td>
                  <td className="px-4 py-3 text-end text-emerald-400">{formatMoney(r.profit, currency)}</td>
                  <td className="px-4 py-3 text-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400 hover:bg-red-950/40" onClick={() => viewReceipt(r.id)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400 hover:bg-red-950/40" onClick={() => setDeleting(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {viewing && (
        <ReceiptViewDialog receipt={viewing} settings={settings} onClose={() => setViewing(null)} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء البون #{deleting?.number}؟</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              سيتم إعادة القطع إلى المخزون. لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!deleting) return
                try {
                  const res = await fetch(`/api/receipts?id=${deleting.id}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error('فشل')
                  toast({ title: `تم إلغاء البون #${deleting.number}`, description: 'أُعيدت القطع للمخزون' })
                  setDeleting(null); load()
                } catch {
                  toast({ title: 'خطأ', description: 'تعذّر الإلغاء', variant: 'destructive' })
                }
              }}
            >
              إلغاء البون
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ReceiptViewDialog({ receipt, settings, onClose }: { receipt: ReceiptWithItems; settings: Settings | null; onClose: () => void }) {
  const currency = settings?.currency || 'دج'
  const storeName = settings?.storeName || 'موتو ورلد 29'

  const handlePrint = () => {
    const printContents = document.getElementById('receipt-view-print')?.innerHTML
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
    w.document.close(); w.focus()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white text-black max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">بون #{receipt.number}</DialogTitle>
        </DialogHeader>

        <div id="receipt-view-print">
          <div className="receipt">
            <div className="header">
              <div className="store-name">{storeName}</div>
              <div className="store-sub">قطع • إكسسوارات • معدات الدراجات النارية</div>
            </div>
            <div className="receipt-info">
              <span>بون #: <strong>{receipt.number}</strong></span>
              <span>{formatDateTime(receipt.createdAt)}</span>
            </div>
            {receipt.customerName && <div className="customer">الزبون: <strong>{receipt.customerName}</strong></div>}
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
                {receipt.items.map((item) => (
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
            <div className="footer">شكراً لزيارتكم 🙏<br />{storeName}</div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="bg-neutral-100 border-neutral-300 text-black hover:bg-neutral-200">إغلاق</Button>
          <Button onClick={handlePrint} className="bg-red-600 hover:bg-red-700 text-white">
            <Printer className="h-4 w-4 me-2" /> طباعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

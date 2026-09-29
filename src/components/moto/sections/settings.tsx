'use client'

import { useEffect, useState } from 'react'
import { Save, Store, Coins, Percent, Image as ImageIcon, Database, Trash2, AlertTriangle, Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '../app-shell'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import type { Settings } from '../types'

interface Props {
  settings: Settings | null
  onUpdate: (patch: Partial<Settings>) => Promise<Settings>
}

export function SettingsSection({ settings, onUpdate }: Props) {
  const [storeName, setStoreName] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName)
      setTaxRate(String(settings.taxRate))
    }
  }, [settings])

  const save = async () => {
    setSaving(true)
    try {
      await onUpdate({
        storeName,
        taxRate: Number(taxRate) || 0,
      })
      toast({ title: 'تم حفظ الإعدادات ✓' })
    } catch {
      toast({ title: 'خطأ', description: 'فشل الحفظ', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="اضبط معلومات متجرك." />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-red-400" />
            <h3 className="font-bold text-white">معلومات المتجر</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="storeName">اسم المتجر</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="currency" className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" /> العملة
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="currency"
                    value="دج"
                    disabled
                    className="bg-neutral-950 border-neutral-800 text-neutral-400 pe-9"
                  />
                  <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">الدينار الجزائري — عملة ثابتة</p>
              </div>
              <div>
                <Label htmlFor="tax" className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5" /> الضريبة (%)
                </Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white mt-1"
                />
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full bg-red-600 hover:bg-red-700 text-white">
              <Save className="h-4 w-4 me-2" />
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-red-400" />
            <h3 className="font-bold text-white">الشعار</h3>
          </div>
          <div className="flex flex-col items-center gap-3">
            <img
              src="/moto-world-logo.jpg"
              alt="شعار موتو ورلد 29"
              className="w-32 h-32 rounded-full object-cover border-2 border-red-600/60 shadow-[0_0_20px_rgba(220,38,38,0.35)]"
            />
            <p className="text-xs text-neutral-400 text-center">
              شعار موتو ورلد 29 يُستخدم في كامل التطبيق.
            </p>
          </div>
        </Card>
      </div>

      {/* Danger zone */}
      <Card className="bg-neutral-900 border-red-900/40 p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-red-400" />
          <h3 className="font-bold text-white">منطقة البيانات</h3>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-300">تحميل بيانات تجريبية</p>
            <p className="text-xs text-neutral-500">يضيف منتجات ومبيعات نموذجية لاختبار التطبيق.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-amber-700 text-amber-400 hover:bg-amber-950/40">
                <Database className="h-4 w-4 me-2" />
                تحميل البيانات التجريبية
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>تحميل البيانات التجريبية؟</AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-400">
                  سيُضاف ~8 منتجات نموذجية وبعض المبيعات على آخر 7 أيام. يُطبَّق مرة واحدة فقط.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/seed', { method: 'POST' })
                      const data = await res.json()
                      if (data.message) {
                        toast({ title: 'معلوم', description: data.message })
                      } else {
                        toast({ title: 'تم تحميل البيانات ✓', description: `${data.productsCreated} منتج مُضاف` })
                      }
                    } catch {
                      toast({ title: 'خطأ', description: 'فشل التحميل', variant: 'destructive' })
                    }
                  }}
                >
                  تحميل
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> إعادة تعيين كل البيانات
            </p>
            <p className="text-xs text-neutral-500">حذف جميع المنتجات والمبيعات والمشتريات نهائياً.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-700 text-red-400 hover:bg-red-950/40">
                <Trash2 className="h-4 w-4 me-2" />
                حذف الكل
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تماماً؟</AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-400">
                  سيتم حذف جميع المنتجات والمبيعات والمشتريات نهائياً. لا يمكن التراجع.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/reset', { method: 'POST' })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'فشل')
                      toast({
                        title: 'تمت إعادة التعيين',
                        description: `حُذف ${data.deleted.sales} مبيعات، ${data.deleted.purchases} مشتريات، ${data.deleted.products} منتجات`,
                      })
                    } catch {
                      toast({ title: 'خطأ', description: 'فشل إعادة التعيين', variant: 'destructive' })
                    }
                  }}
                >
                  حذف الكل
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <div className="mt-6 text-center text-xs text-neutral-600">
        موتو ورلد 29 — إدارة الإصدار 1.0 • البيانات محفوظة محلياً على هذا الجهاز
      </div>
    </div>
  )
}

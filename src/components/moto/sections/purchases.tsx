'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Truck, Plus, Minus, CheckCircle2, Package, RefreshCw, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
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
  const currency = settings?.currency || 'DH'
  const { toast } = useToast()

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = await res.json()
      setProducts(data)
    } catch {
      toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/purchases', { cache: 'no-store' })
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
    setCart((prev) => {
      const ex = prev.find((x) => x.product.id === p.id)
      if (ex) {
        return prev.map((x) => (x.product.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))
      }
      return [...prev, { product: p, quantity: 1, unitPrice: p.purchasePrice }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((x) => (x.product.id === id ? { ...x, quantity: Math.max(1, x.quantity + delta) } : x))
        .filter((x) => x.quantity > 0),
    )
  }

  const setQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((x) => (x.product.id === id ? { ...x, quantity: Math.max(1, qty) } : x)),
    )
  }

  const setPrice = (id: string, price: number) => {
    setCart((prev) => prev.map((x) => (x.product.id === id ? { ...x, unitPrice: price } : x)))
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((x) => x.product.id !== id))
  }

  const total = cart.reduce((s, x) => s + x.unitPrice * x.quantity, 0)

  const submit = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const items = cart.map((x) => ({
        productId: x.product.id,
        quantity: x.quantity,
        unitPrice: x.unitPrice,
      }))
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Échec')
      }
      toast({
        title: 'Achat enregistré ✓',
        description: `Stock mis à jour • Total: ${formatMoney(total, currency)}`,
      })
      setCart([])
      loadProducts()
      loadRecent()
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Échec', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Achats / Réapprovisionnement"
        subtitle="Enregistrez vos achats de pièces. Le stock et le prix d'achat sont mis à jour automatiquement."
        action={
          <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Rechercher une pièce..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-52 bg-neutral-900 border-neutral-800 text-white">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="ALL">Toutes</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {loading && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                <Package className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                Chargement...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                Aucun produit. Ajoutez-en depuis le Stock.
              </div>
            )}
            {filtered.map((p) => {
              const inCart = cart.find((x) => x.product.id === p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`text-left p-3 rounded-xl border transition-all relative ${
                    inCart
                      ? 'border-amber-600 bg-amber-950/30'
                      : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
                  }`}
                >
                  {inCart && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                      {inCart.quantity}
                    </div>
                  )}
                  <div className="text-xs text-neutral-400 mb-1">{categoryLabel(p.category)}</div>
                  <div className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5rem]">
                    {p.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-amber-400">{formatMoney(p.purchasePrice, currency)}</div>
                    <Badge variant="outline" className="text-[10px] border-neutral-700 text-neutral-300">
                      Stock: {p.quantity}
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
              <Truck className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white">Réappro</h3>
              {cart.length > 0 && (
                <Badge className="bg-amber-600 text-white">{cart.length}</Badge>
              )}
            </div>
            {cart.length > 0 && (
              <Button size="sm" variant="ghost" className="text-xs text-neutral-400 hover:text-red-400" onClick={() => setCart([])}>
                Vider
              </Button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <Truck className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Panier vide</p>
              <p className="text-xs mt-1">Cliquez sur un produit pour le réapprovisionner</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
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
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Prix achat:</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={x.unitPrice}
                      onChange={(e) => setPrice(x.product.id, Number(e.target.value))}
                      className="h-7 flex-1 bg-neutral-900 border-neutral-700 text-white px-2 text-sm"
                    />
                  </div>
                  <div className="mt-2 text-right text-sm font-bold text-white">
                    {formatMoney(x.unitPrice * x.quantity, currency)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Total achat</span>
                <span className="text-white font-bold">{formatMoney(total, currency)}</span>
              </div>
              <Button
                onClick={submit}
                disabled={submitting}
                className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Enregistrer l'achat
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Recent purchases */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-white mb-3">Achats récents</h3>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm bg-neutral-900 rounded-lg border border-neutral-800">
            Aucun achat enregistré
          </div>
        ) : (
          <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-950/50 border-b border-neutral-800 sticky top-0">
                  <tr className="text-left text-neutral-400">
                    <th className="px-4 py-2 font-semibold">Date</th>
                    <th className="px-4 py-2 font-semibold">Produit</th>
                    <th className="px-4 py-2 font-semibold text-center">Qté</th>
                    <th className="px-4 py-2 font-semibold text-right">Prix unitaire</th>
                    <th className="px-4 py-2 font-semibold text-right">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30">
                      <td className="px-4 py-2 text-xs text-neutral-400">{formatDateTime(p.createdAt)}</td>
                      <td className="px-4 py-2 text-white">{p.product.name}</td>
                      <td className="px-4 py-2 text-center text-neutral-300">{p.quantity}</td>
                      <td className="px-4 py-2 text-right text-neutral-300">{formatMoney(p.unitPrice, currency)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-white">{formatMoney(p.total, currency)}</td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-950/40"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/purchases?id=${p.id}`, { method: 'DELETE' })
                              if (!res.ok) throw new Error('Échec')
                              toast({ title: 'Achat supprimé', description: 'Stock ajusté' })
                              loadProducts()
                              loadRecent()
                            } catch {
                              toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' })
                            }
                          }}
                        >
                          Annuler
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

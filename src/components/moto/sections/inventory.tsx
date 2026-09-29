'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader } from '../app-shell'
import { CATEGORIES, categoryLabel, formatMoney } from '@/lib/format'
import type { Product, Settings } from '../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  settings: Settings | null
}

export function InventorySection({ settings }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const currency = settings?.currency || 'DH'
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = await res.json()
      setProducts(data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger le stock', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter
    return matchSearch && matchCat
  })

  const totalValue = filtered.reduce((s, p) => s + p.purchasePrice * p.quantity, 0)
  const lowCount = filtered.filter((p) => p.quantity <= p.minQuantity).length

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle={`${products.length} produit(s) • Valeur: ${formatMoney(totalValue, currency)}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 hover:text-white">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button size="sm" onClick={() => setCreating(true)} className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Rechercher par nom ou code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-56 bg-neutral-900 border-neutral-800 text-white">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
            <SelectItem value="ALL">Toutes catégories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Low stock warning */}
      {lowCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{lowCount} produit(s) en stock faible — pensez à réapprovisionner</span>
        </div>
      )}

      {/* Table */}
      <Card className="bg-neutral-900 border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-950/50 border-b border-neutral-800">
              <tr className="text-left text-neutral-400">
                <th className="px-4 py-3 font-semibold">Produit</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Catégorie</th>
                <th className="px-4 py-3 font-semibold text-right">Prix achat</th>
                <th className="px-4 py-3 font-semibold text-right">Prix vente</th>
                <th className="px-4 py-3 font-semibold text-right">Marge</th>
                <th className="px-4 py-3 font-semibold text-center">Stock</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    <Package className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    Chargement...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Aucun produit. Cliquez sur "Nouveau produit" pour commencer.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const margin = p.salePrice - p.purchasePrice
                const marginPct = p.salePrice > 0 ? (margin / p.salePrice) * 100 : 0
                const isLow = p.quantity <= p.minQuantity
                const isOut = p.quantity === 0
                return (
                  <tr key={p.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{p.name}</div>
                      {p.sku && <div className="text-xs text-neutral-500">{p.sku}</div>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                        {categoryLabel(p.category)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-300">{formatMoney(p.purchasePrice, currency)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">{formatMoney(p.salePrice, currency)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-emerald-400 font-semibold">+{formatMoney(margin, currency)}</div>
                      <div className="text-xs text-neutral-500">{marginPct.toFixed(0)}%</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          isOut
                            ? 'border-red-600 text-red-400 bg-red-950/30'
                            : isLow
                            ? 'border-amber-600 text-amber-400 bg-amber-950/30'
                            : 'border-emerald-700 text-emerald-400 bg-emerald-950/20'
                        }
                      >
                        {p.quantity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800" onClick={() => setEditing(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400 hover:bg-red-950/40" onClick={() => setDeleting(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit dialog */}
      {(creating || editing) && (
        <ProductFormDialog
          product={editing}
          currency={currency}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditing(null)
            load()
          }}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Vous êtes sur le point de supprimer <strong className="text-white">{deleting?.name}</strong>. Cette action est irréversible.
              Les ventes et achats historiques liés seront conservés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (!deleting) return
                try {
                  const res = await fetch(`/api/products/${deleting.id}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error('Échec')
                  toast({ title: 'Produit supprimé', description: deleting.name })
                  setDeleting(null)
                  load()
                } catch {
                  toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' })
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProductFormDialog({
  product,
  currency,
  onClose,
  onSaved,
}: {
  product: Product | null
  currency: string
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!product
  const [name, setName] = useState(product?.name || '')
  const [category, setCategory] = useState(product?.category || 'PIECES')
  const [sku, setSku] = useState(product?.sku || '')
  const [purchasePrice, setPurchasePrice] = useState(String(product?.purchasePrice ?? ''))
  const [salePrice, setSalePrice] = useState(String(product?.salePrice ?? ''))
  const [quantity, setQuantity] = useState(String(product?.quantity ?? '0'))
  const [minQuantity, setMinQuantity] = useState(String(product?.minQuantity ?? '5'))
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const submit = async () => {
    if (!name.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        category,
        sku: sku.trim(),
        purchasePrice: Number(purchasePrice) || 0,
        salePrice: Number(salePrice) || 0,
        quantity: Number(quantity) || 0,
        minQuantity: Number(minQuantity) || 0,
      }
      const res = isEdit
        ? await fetch(`/api/products/${product!.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Échec')
      }
      toast({ title: isEdit ? 'Produit mis à jour' : 'Produit créé', description: name })
      onSaved()
    } catch (e) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Échec', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const margin = (Number(salePrice) || 0) - (Number(purchasePrice) || 0)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Renseignez les informations du produit. Le prix d'achat sert au calcul du bénéfice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label htmlFor="name">Nom du produit *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Plaquettes de frein YBR125" className="bg-neutral-950 border-neutral-800 text-white mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cat">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cat" className="bg-neutral-950 border-neutral-800 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sku">Code (SKU)</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex: BRK-YBR125" className="bg-neutral-950 border-neutral-800 text-white mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pp">Prix d'achat ({currency}) *</Label>
              <Input id="pp" type="number" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0.00" className="bg-neutral-950 border-neutral-800 text-white mt-1" />
            </div>
            <div>
              <Label htmlFor="sp">Prix de vente ({currency}) *</Label>
              <Input id="sp" type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" className="bg-neutral-950 border-neutral-800 text-white mt-1" />
            </div>
          </div>

          <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm">
            <span className="text-neutral-400">Marge unitaire: </span>
            <span className="text-emerald-400 font-bold">{formatMoney(margin, currency)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="qty">Quantité en stock</Label>
              <Input id="qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-neutral-950 border-neutral-800 text-white mt-1" />
            </div>
            <div>
              <Label htmlFor="min">Stock d'alerte (min)</Label>
              <Input id="min" type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className="bg-neutral-950 border-neutral-800 text-white mt-1" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">Annuler</Button>
          <Button onClick={submit} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
            {saving ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

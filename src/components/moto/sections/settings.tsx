'use client'

import { useEffect, useState } from 'react'
import { Save, Store, Coins, Percent, Image as ImageIcon, Database, Trash2, AlertTriangle } from 'lucide-react'
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
  const [currency, setCurrency] = useState('DH')
  const [taxRate, setTaxRate] = useState('0')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName)
      setCurrency(settings.currency)
      setTaxRate(String(settings.taxRate))
    }
  }, [settings])

  const save = async () => {
    setSaving(true)
    try {
      await onUpdate({
        storeName,
        currency,
        taxRate: Number(taxRate) || 0,
      })
      toast({ title: 'Paramètres enregistrés ✓' })
    } catch {
      toast({ title: 'Erreur', description: 'Échec de l\'enregistrement', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Configurez les informations de votre magasin." />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-5 w-5 text-red-400" />
            <h3 className="font-bold text-white">Informations magasin</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="storeName">Nom du magasin</Label>
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
                  <Coins className="h-3.5 w-3.5" /> Devise
                </Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="DH, EUR, USD..."
                  className="bg-neutral-950 border-neutral-800 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tax" className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5" /> TVA (%)
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
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-red-400" />
            <h3 className="font-bold text-white">Logo</h3>
          </div>
          <div className="flex flex-col items-center gap-3">
            <img
              src="/moto-world-logo.jpg"
              alt="Logo Moto World 29"
              className="w-32 h-32 rounded-full object-cover border-2 border-red-600/60 shadow-[0_0_20px_rgba(220,38,38,0.35)]"
            />
            <p className="text-xs text-neutral-400 text-center">
              Logo Moto World 29 utilisé dans toute l'application.
            </p>
          </div>
        </Card>
      </div>

      {/* Danger zone */}
      <Card className="bg-neutral-900 border-red-900/40 p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-red-400" />
          <h3 className="font-bold text-white">Zone de données</h3>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-300">Charger des données de démonstration</p>
            <p className="text-xs text-neutral-500">Ajoute des produits et ventes d'exemple pour tester l'application.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-amber-700 text-amber-400 hover:bg-amber-950/40">
                <Database className="h-4 w-4 mr-2" />
                Charger démo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Charger les données de démo ?</AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-400">
                  Cela ajoutera ~8 produits d'exemple et quelques ventes sur les 7 derniers jours. Ne s'applique qu'une seule fois.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/seed', { method: 'POST' })
                      const data = await res.json()
                      if (data.message) {
                        toast({ title: 'Info', description: data.message })
                      } else {
                        toast({ title: 'Données démo chargées ✓', description: `${data.productsCreated} produits ajoutés` })
                      }
                    } catch {
                      toast({ title: 'Erreur', description: 'Échec du chargement', variant: 'destructive' })
                    }
                  }}
                >
                  Charger
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Réinitialiser toutes les données
            </p>
            <p className="text-xs text-neutral-500">Supprime définitivement tous les produits, ventes et achats.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-700 text-red-400 hover:bg-red-950/40">
                <Trash2 className="h-4 w-4 mr-2" />
                Tout supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-400">
                  Cette action supprimera DÉFINITIVEMENT tous les produits, ventes et achats. Impossible à annuler.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    // Use a custom reset endpoint via fetch to /api/products etc.
                    try {
                      const [products, sales, purchases] = await Promise.all([
                        fetch('/api/products').then((r) => r.json()),
                        fetch('/api/sales').then((r) => r.json()),
                        fetch('/api/purchases').then((r) => r.json()),
                      ])
                      await Promise.all([
                        ...products.map((p: { id: string }) => fetch(`/api/products/${p.id}`, { method: 'DELETE' })),
                        ...sales.map((s: { id: string }) => fetch(`/api/sales?id=${s.id}`, { method: 'DELETE' })),
                        ...purchases.map((p: { id: string }) => fetch(`/api/purchases?id=${p.id}`, { method: 'DELETE' })),
                      ])
                      toast({ title: 'Données réinitialisées', description: 'Tout a été supprimé' })
                    } catch {
                      toast({ title: 'Erreur', description: 'Échec de la réinitialisation', variant: 'destructive' })
                    }
                  }}
                >
                  Tout supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      <div className="mt-6 text-center text-xs text-neutral-600">
        Moto World 29 — Gestion v1.0 • Données stockées localement sur cet appareil
      </div>
    </div>
  )
}

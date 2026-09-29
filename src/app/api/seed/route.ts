import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/seed - add demo data so the user can see how the app works
export async function POST() {
  try {
    // Check if already seeded
    const existing = await db.product.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Already seeded', count: existing })
    }

    const now = new Date()

    const products = await db.$transaction([
      db.product.create({
        data: {
          name: 'Plaquettes de frein avant YBR125',
          category: 'PIECES',
          sku: 'BRK-YBR125-F',
          purchasePrice: 45,
          salePrice: 80,
          quantity: 12,
          minQuantity: 5,
        },
      }),
      db.product.create({
        data: {
          name: 'Chaîne de transmission 428H',
          category: 'PIECES',
          sku: 'CHN-428H',
          purchasePrice: 60,
          salePrice: 110,
          quantity: 8,
          minQuantity: 3,
        },
      }),
      db.product.create({
        data: {
          name: 'Pneu arrière 130/70-17',
          category: 'PIECES',
          sku: 'TIR-130-17',
          purchasePrice: 180,
          salePrice: 280,
          quantity: 6,
          minQuantity: 2,
        },
      }),
      db.product.create({
        data: {
          name: 'Casque intégral Noir Mat',
          category: 'EQUIPEMENTS',
          sku: 'HLM-FULL-BLK',
          purchasePrice: 320,
          salePrice: 550,
          quantity: 5,
          minQuantity: 2,
        },
      }),
      db.product.create({
        data: {
          name: 'Gants moto cuir',
          category: 'EQUIPEMENTS',
          sku: 'GLV-LTHR-M',
          purchasePrice: 70,
          salePrice: 130,
          quantity: 10,
          minQuantity: 3,
        },
      }),
      db.product.create({
        data: {
          name: 'Rétroviseur droit universel',
          category: 'ACCESSOIRES',
          sku: 'MIR-R-UNI',
          purchasePrice: 25,
          salePrice: 50,
          quantity: 15,
          minQuantity: 5,
        },
      }),
      db.product.create({
        data: {
          name: 'Clignotant LED arrière',
          category: 'ACCESSOIRES',
          sku: 'IND-LED-R',
          purchasePrice: 30,
          salePrice: 65,
          quantity: 4,
          minQuantity: 4,
        },
      }),
      db.product.create({
        data: {
          name: 'Filtre à air CG150',
          category: 'PIECES',
          sku: 'AIR-CG150',
          purchasePrice: 18,
          salePrice: 40,
          quantity: 20,
          minQuantity: 5,
        },
      }),
    ])

    // create some sales across today + last 7 days
    const sampleSales: Array<{ productId: string; qty: number; daysAgo: number; hour: number }> = [
      { productId: products[0].id, qty: 2, daysAgo: 0, hour: 9 },
      { productId: products[2].id, qty: 1, daysAgo: 0, hour: 11 },
      { productId: products[3].id, qty: 1, daysAgo: 0, hour: 14 },
      { productId: products[5].id, qty: 3, daysAgo: 1, hour: 10 },
      { productId: products[1].id, qty: 2, daysAgo: 1, hour: 15 },
      { productId: products[4].id, qty: 1, daysAgo: 2, hour: 9 },
      { productId: products[7].id, qty: 4, daysAgo: 2, hour: 13 },
      { productId: products[0].id, qty: 1, daysAgo: 3, hour: 11 },
      { productId: products[6].id, qty: 2, daysAgo: 3, hour: 16 },
      { productId: products[2].id, qty: 1, daysAgo: 4, hour: 10 },
      { productId: products[5].id, qty: 5, daysAgo: 5, hour: 14 },
      { productId: products[1].id, qty: 1, daysAgo: 6, hour: 12 },
    ]

    for (const s of sampleSales) {
      const saleDate = new Date(now)
      saleDate.setDate(saleDate.getDate() - s.daysAgo)
      saleDate.setHours(s.hour, 30, 0, 0)
      const p = products.find((x) => x.id === s.productId)!
      await db.sale.create({
        data: {
          productId: p.id,
          quantity: s.qty,
          unitPrice: p.salePrice,
          unitCost: p.purchasePrice,
          total: p.salePrice * s.qty,
          profit: (p.salePrice - p.purchasePrice) * s.qty,
          createdAt: saleDate,
        },
      })
      // decrement stock to reflect these sales
      await db.product.update({
        where: { id: p.id },
        data: { quantity: { decrement: s.qty } },
      })
    }

    return NextResponse.json({ success: true, productsCreated: products.length })
  } catch (error) {
    console.error('POST /api/seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}

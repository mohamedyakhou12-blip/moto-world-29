import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/seed - add demo data
export async function POST() {
  try {
    const existing = await db.product.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Already seeded', count: existing })
    }

    const now = new Date()

    const products = await db.$transaction([
      db.product.create({
        data: {
          name: 'فحمات فرامل أمامية YBR125',
          category: 'PIECES',
          sku: 'BRK-YBR125-F',
          purchasePrice: 1200,
          salePrice: 2200,
          quantity: 12,
          minQuantity: 5,
        },
      }),
      db.product.create({
        data: {
          name: 'سلسلة نقل الحركة 428H',
          category: 'PIECES',
          sku: 'CHN-428H',
          purchasePrice: 1800,
          salePrice: 3200,
          quantity: 8,
          minQuantity: 3,
        },
      }),
      db.product.create({
        data: {
          name: 'إطار خلفي 130/70-17',
          category: 'PIECES',
          sku: 'TIR-130-17',
          purchasePrice: 4500,
          salePrice: 7000,
          quantity: 6,
          minQuantity: 2,
        },
      }),
      db.product.create({
        data: {
          name: 'خوذة كاملة سوداء مطفية',
          category: 'EQUIPEMENTS',
          sku: 'HLM-FULL-BLK',
          purchasePrice: 8000,
          salePrice: 13500,
          quantity: 5,
          minQuantity: 2,
        },
      }),
      db.product.create({
        data: {
          name: 'قفازات جلدية للدراجة',
          category: 'EQUIPEMENTS',
          sku: 'GLV-LTHR-M',
          purchasePrice: 1800,
          salePrice: 3500,
          quantity: 10,
          minQuantity: 3,
        },
      }),
      db.product.create({
        data: {
          name: 'مرآة جانبية يمنى عالمية',
          category: 'ACCESSOIRES',
          sku: 'MIR-R-UNI',
          purchasePrice: 700,
          salePrice: 1500,
          quantity: 15,
          minQuantity: 5,
        },
      }),
      db.product.create({
        data: {
          name: 'وميض LED خلفي',
          category: 'ACCESSOIRES',
          sku: 'IND-LED-R',
          purchasePrice: 900,
          salePrice: 1900,
          quantity: 4,
          minQuantity: 4,
        },
      }),
      db.product.create({
        data: {
          name: 'فلتر هواء CG150',
          category: 'PIECES',
          sku: 'AIR-CG150',
          purchasePrice: 500,
          salePrice: 1100,
          quantity: 20,
          minQuantity: 5,
        },
      }),
    ])

    // Create sample receipts across today + last 7 days
    const sampleReceipts: Array<{ items: Array<{ productId: number; qty: number }>; daysAgo: number; hour: number; customer?: string }> = [
      { items: [{ productId: 0, qty: 2 }, { productId: 7, qty: 1 }], daysAgo: 0, hour: 9, customer: 'أحمد' },
      { items: [{ productId: 2, qty: 1 }], daysAgo: 0, hour: 11 },
      { items: [{ productId: 3, qty: 1 }, { productId: 4, qty: 1 }], daysAgo: 0, hour: 14, customer: 'محمد' },
      { items: [{ productId: 5, qty: 3 }], daysAgo: 1, hour: 10 },
      { items: [{ productId: 1, qty: 2 }], daysAgo: 1, hour: 15, customer: 'يوسف' },
      { items: [{ productId: 7, qty: 4 }], daysAgo: 2, hour: 9 },
      { items: [{ productId: 0, qty: 1 }, { productId: 6, qty: 2 }], daysAgo: 2, hour: 13 },
      { items: [{ productId: 2, qty: 1 }], daysAgo: 3, hour: 10 },
      { items: [{ productId: 4, qty: 1 }], daysAgo: 4, hour: 11 },
      { items: [{ productId: 5, qty: 5 }], daysAgo: 5, hour: 14, customer: 'سعيد' },
      { items: [{ productId: 1, qty: 1 }], daysAgo: 6, hour: 12 },
    ]

    let receiptNumber = 1
    for (const sr of sampleReceipts) {
      const receiptDate = new Date(now)
      receiptDate.setDate(receiptDate.getDate() - sr.daysAgo)
      receiptDate.setHours(sr.hour, 30, 0, 0)

      let subtotal = 0
      let totalCost = 0
      let itemCount = 0
      const itemsData: Array<{
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        unitCost: number
        total: number
        profit: number
      }> = []

      for (const it of sr.items) {
        const p = products[it.productId]
        const qty = it.qty
        subtotal += p.salePrice * qty
        totalCost += p.purchasePrice * qty
        itemCount += qty
        itemsData.push({
          productId: p.id,
          productName: p.name,
          quantity: qty,
          unitPrice: p.salePrice,
          unitCost: p.purchasePrice,
          total: p.salePrice * qty,
          profit: (p.salePrice - p.purchasePrice) * qty,
        })
        // decrement stock
        await db.product.update({
          where: { id: p.id },
          data: { quantity: { decrement: qty } },
        })
      }

      const total = subtotal
      const profit = subtotal - totalCost

      await db.receipt.create({
        data: {
          number: receiptNumber++,
          customerName: sr.customer || null,
          subtotal,
          discount: 0,
          total,
          profit,
          itemCount,
          createdAt: receiptDate,
          items: {
            create: itemsData,
          },
        },
      })
    }

    return NextResponse.json({ success: true, productsCreated: products.length, receiptsCreated: sampleReceipts.length })
  } catch (error) {
    console.error('POST /api/seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}

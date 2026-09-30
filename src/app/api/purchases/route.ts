import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/purchases - list all purchases
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: { createdAt?: { gte?: Date; lte?: Date } } = {}
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const purchases = await db.purchase.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return NextResponse.json(purchases)
  } catch (error) {
    console.error('GET /api/purchases error:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

// POST /api/purchases - record a purchase / restock
// items: [{ productId, quantity, unitPrice }]  — للقطع الموجودة
// OR create new products: items: [{ name, category, sku, unitPrice, quantity }]  — لقطع جديدة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: Array<{
      productId?: string
      name?: string
      category?: string
      sku?: string
      quantity: number
      unitPrice?: number
      salePrice?: number
    }> = Array.isArray(body.items) ? body.items : [body]

    if (items.length === 0) {
      return NextResponse.json({ error: 'لا توجد قطع' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const created: Array<{
        id: string
        productName: string
        quantity: number
        unitPrice: number
        total: number
        isNew: boolean
        createdAt: Date
      }> = []

      for (const item of items) {
        const qty = Number(item.quantity)
        if (!qty || qty <= 0) throw new Error('الكمية غير صحيحة')

        if (item.productId) {
          // قطعة موجودة - حدّث المخزون وسعر الشراء
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (!product) throw new Error(`المنتج غير موجود: ${item.productId}`)

          const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.purchasePrice
          const total = unitPrice * qty

          const purchase = await tx.purchase.create({
            data: {
              productId: product.id,
              quantity: qty,
              unitPrice,
              total,
            },
          })

          await tx.product.update({
            where: { id: product.id },
            data: {
              quantity: { increment: qty },
              purchasePrice: unitPrice,
            },
          })

          created.push({
            id: purchase.id,
            productName: product.name,
            quantity: qty,
            unitPrice,
            total,
            isNew: false,
            createdAt: purchase.createdAt,
          })
        } else if (item.name) {
          // قطعة جديدة - أنشئها ثم سجّل الشراء
          const unitPrice = Number(item.unitPrice) || 0
          const salePrice = Number(item.salePrice) || 0
          const total = unitPrice * qty

          const product = await tx.product.create({
            data: {
              name: item.name.trim(),
              category: item.category || 'PIECES',
              sku: item.sku?.trim() || null,
              purchasePrice: unitPrice,
              salePrice,
              quantity: qty,
              minQuantity: 0,
            },
          })

          const purchase = await tx.purchase.create({
            data: {
              productId: product.id,
              quantity: qty,
              unitPrice,
              total,
            },
          })

          created.push({
            id: purchase.id,
            productName: product.name,
            quantity: qty,
            unitPrice,
            total,
            isNew: true,
            createdAt: purchase.createdAt,
          })
        } else {
          throw new Error('يجب توفير productId أو name')
        }
      }

      return created
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to record purchase'
    console.error('POST /api/purchases error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/purchases?id=... - delete a purchase record (adjust stock)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await db.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({ where: { id } })
      if (!purchase) throw new Error('الشراء غير موجود')

      const product = await tx.product.findUnique({ where: { id: purchase.productId } })
      if (product && product.quantity >= purchase.quantity) {
        await tx.product.update({
          where: { id: purchase.productId },
          data: { quantity: { decrement: purchase.quantity } },
        })
      }
      await tx.purchase.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete purchase'
    console.error('DELETE /api/purchases error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

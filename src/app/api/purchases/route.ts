import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/purchases - list all purchases (optionally filtered)
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

// POST /api/purchases - record a purchase / restock (increment stock)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items: Array<{
      productId: string
      quantity: number
      unitPrice?: number
      note?: string
    }> = Array.isArray(body.items) ? body.items : [body]

    if (items.length === 0) {
      return NextResponse.json({ error: 'Aucun article à enregistrer' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const created: Array<{
        id: string
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        total: number
        createdAt: Date
      }> = []

      for (const item of items) {
        const qty = Number(item.quantity)
        if (!item.productId || !qty || qty <= 0) {
          throw new Error('Données d\'achat invalides')
        }

        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Produit introuvable: ${item.productId}`)

        const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.purchasePrice
        const total = unitPrice * qty

        const purchase = await tx.purchase.create({
          data: {
            productId: product.id,
            quantity: qty,
            unitPrice,
            total,
            note: item.note || null,
          },
        })

        // Update stock + purchase price (last purchase price wins)
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: { increment: qty },
            purchasePrice: unitPrice,
          },
        })

        created.push({
          id: purchase.id,
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice,
          total,
          createdAt: purchase.createdAt,
        })
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

// DELETE /api/purchases - delete a purchase record (and decrement stock)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await db.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({ where: { id } })
      if (!purchase) throw new Error('Achat introuvable')

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

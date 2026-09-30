import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/sales - list all sales (optionally filtered by date range)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const productId = searchParams.get('productId')

    const where: {
      createdAt?: { gte?: Date; lte?: Date }
      productId?: string
    } = {}

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }
    if (productId) where.productId = productId

    const sales = await db.sale.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return NextResponse.json(sales)
  } catch (error) {
    console.error('GET /api/sales error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

// POST /api/sales - record a sale (and decrement stock)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // support both single and multi-item sales
    const items: Array<{
      productId: string
      quantity: number
      unitPrice?: number
    }> = Array.isArray(body.items) ? body.items : [body]

    if (items.length === 0) {
      return NextResponse.json({ error: 'Aucun article à vendre' }, { status: 400 })
    }

    // Use a transaction to keep stock consistent
    const result = await db.$transaction(async (tx) => {
      const created: Array<{
        id: string
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        unitCost: number
        total: number
        profit: number
        createdAt: Date
      }> = []

      for (const item of items) {
        const qty = Number(item.quantity)
        if (!item.productId || !qty || qty <= 0) {
          throw new Error('Données de vente invalides')
        }

        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Produit introuvable: ${item.productId}`)
        if (product.quantity < qty) {
          throw new Error(`Stock insuffisant pour "${product.name}" (disponible: ${product.quantity})`)
        }

        const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.salePrice
        const unitCost = product.purchasePrice
        const total = unitPrice * qty
        const profit = (unitPrice - unitCost) * qty

        const sale = await tx.sale.create({
          data: {
            productId: product.id,
            quantity: qty,
            unitPrice,
            unitCost,
            total,
            profit,
          },
        })

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: qty } },
        })

        created.push({
          id: sale.id,
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice,
          unitCost,
          total,
          profit,
          createdAt: sale.createdAt,
        })
      }

      return created
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to record sale'
    console.error('POST /api/sales error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/sales - delete a sale (and restore stock)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await db.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id } })
      if (!sale) throw new Error('Vente introuvable')

      await tx.product.update({
        where: { id: sale.productId },
        data: { quantity: { increment: sale.quantity } },
      })
      await tx.sale.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete sale'
    console.error('DELETE /api/sales error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

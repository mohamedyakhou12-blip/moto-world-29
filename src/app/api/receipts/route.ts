import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/receipts - list all receipts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const limit = Number(searchParams.get('limit') || 100)

    const where: { createdAt?: { gte?: Date; lte?: Date } } = {}
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const receipts = await db.receipt.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json(receipts)
  } catch (error) {
    console.error('GET /api/receipts error:', error)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}

// POST /api/receipts - create a new receipt (bon) with multiple items
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerName, discount, items, note } = body as {
      customerName?: string
      discount?: number
      items: Array<{ productId: string; quantity: number; unitPrice?: number }>
      note?: string
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'لا توجد قطع في البون' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      // Get the next receipt number
      const lastReceipt = await tx.receipt.findFirst({ orderBy: { number: 'desc' } })
      const nextNumber = (lastReceipt?.number || 0) + 1

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

      // Validate stock and prepare items
      for (const item of items) {
        const qty = Number(item.quantity)
        if (!item.productId || !qty || qty <= 0) {
          throw new Error('بيانات القطعة غير صحيحة')
        }
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`المنتج غير موجود: ${item.productId}`)
        if (product.quantity < qty) {
          throw new Error(`المخزون غير كافٍ لـ "${product.name}" (المتوفر: ${product.quantity})`)
        }
        const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.salePrice
        const unitCost = product.purchasePrice
        const total = unitPrice * qty
        const profit = (unitPrice - unitCost) * qty
        subtotal += total
        totalCost += unitCost * qty
        itemCount += qty
        itemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice,
          unitCost,
          total,
          profit,
        })
      }

      const discountValue = Number(discount) || 0
      const finalTotal = Math.max(0, subtotal - discountValue)
      // Profit decreases by the discount proportionally
      const profitRatio = subtotal > 0 ? finalTotal / subtotal : 1
      const finalProfit = (subtotal - totalCost) * profitRatio

      // Create the receipt
      const receipt = await tx.receipt.create({
        data: {
          number: nextNumber,
          customerName: customerName?.trim() || null,
          subtotal,
          discount: discountValue,
          total: finalTotal,
          profit: finalProfit,
          itemCount,
          note: note || null,
          items: {
            create: itemsData.map((it) => ({
              productId: it.productId,
              productName: it.productName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              unitCost: it.unitCost,
              total: it.total,
              profit: it.profit,
            })),
          },
        },
        include: { items: true },
      })

      // Decrement stock for each product
      for (const it of itemsData) {
        await tx.product.update({
          where: { id: it.productId },
          data: { quantity: { decrement: it.quantity } },
        })
      }

      return receipt
    })

    // Fetch the full receipt with items + products for the response
    const fullReceipt = await db.receipt.findUnique({
      where: { id: result.id },
      include: { items: { include: { product: true } } },
    })

    return NextResponse.json(fullReceipt, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to create receipt'
    console.error('POST /api/receipts error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/receipts?id=... - cancel a receipt (restore stock)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await db.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!receipt) throw new Error('البون غير موجود')

      // Restore stock for each item
      for (const item of receipt.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        })
      }

      await tx.receipt.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete receipt'
    console.error('DELETE /api/receipts error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({ where: { id } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json(product)
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, category, sku, purchasePrice, salePrice, quantity, minQuantity } = body

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(category !== undefined && { category }),
        ...(sku !== undefined && { sku: sku ? String(sku).trim() : null }),
        ...(purchasePrice !== undefined && { purchasePrice: Number(purchasePrice) }),
        ...(salePrice !== undefined && { salePrice: Number(salePrice) }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(minQuantity !== undefined && { minQuantity: Number(minQuantity) }),
      },
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Delete in correct order to avoid FK constraint violations:
    // 1. Receipt items referencing this product (will cascade to Receipt if empty, but we delete manually)
    // 2. Purchases referencing this product
    // 3. The product itself
    // Note: deleting receipt items may leave empty receipts, but we keep them for history.
    await db.$transaction([
      db.receiptItem.deleteMany({ where: { productId: id } }),
      db.purchase.deleteMany({ where: { productId: id } }),
      db.product.delete({ where: { id } }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

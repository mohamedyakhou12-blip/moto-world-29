import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products?q=search&category=PIECES
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''

    const where: { name?: { contains: string }; sku?: { contains: string }; category?: string } = {}
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
      ]
    }
    if (category && category !== 'ALL') {
      where.category = category
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products - create a new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, category, sku, purchasePrice, salePrice, quantity, minQuantity } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        category: category || 'PIECES',
        sku: sku?.trim() || null,
        purchasePrice: Number(purchasePrice) || 0,
        salePrice: Number(salePrice) || 0,
        quantity: Number(quantity) || 0,
        minQuantity: Number(minQuantity) || 0,
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

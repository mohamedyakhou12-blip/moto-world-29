import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products - list all products
export async function GET() {
  try {
    const products = await db.product.findMany({
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
      return NextResponse.json({ error: 'Le nom du produit est requis' }, { status: 400 })
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

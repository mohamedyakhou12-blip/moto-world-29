import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/reset - delete ALL data (sales, purchases, then products) in a transaction
export async function POST() {
  try {
    const result = await db.$transaction([
      db.sale.deleteMany({}),
      db.purchase.deleteMany({}),
      db.product.deleteMany({}),
    ])
    return NextResponse.json({
      success: true,
      deleted: {
        sales: result[0].count,
        purchases: result[1].count,
        products: result[2].count,
      },
    })
  } catch (error) {
    console.error('POST /api/reset error:', error)
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 })
  }
}

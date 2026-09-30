import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/reset - delete ALL data in correct order (FK-safe)
export async function POST() {
  try {
    const result = await db.$transaction([
      db.receiptItem.deleteMany({}),
      db.receipt.deleteMany({}),
      db.purchase.deleteMany({}),
      db.product.deleteMany({}),
    ])
    // Try to reset the auto-increment for receipt number (ignore errors if sqlite_sequence doesn't exist)
    try {
      await db.$executeRawUnsafe('DELETE FROM sqlite_sequence WHERE name = ?', 'Receipt')
    } catch {
      // ignore — sequence table may not exist
    }
    return NextResponse.json({
      success: true,
      deleted: {
        receiptItems: result[0].count,
        receipts: result[1].count,
        purchases: result[2].count,
        products: result[3].count,
      },
    })
  } catch (error) {
    console.error('POST /api/reset error:', error)
    return NextResponse.json({ error: 'Failed to reset data' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/receipts/[id] - get a single receipt with items (for printing)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const receipt = await db.receipt.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    })
    if (!receipt) return NextResponse.json({ error: 'البون غير موجود' }, { status: 404 })
    return NextResponse.json(receipt)
  } catch (error) {
    console.error('GET /api/receipts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 })
  }
}

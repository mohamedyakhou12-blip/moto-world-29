import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings
export async function GET() {
  try {
    let settings = await db.settings.findUnique({ where: { id: '1' } })
    if (!settings) {
      settings = await db.settings.create({
        data: {
          id: '1',
          storeName: 'Moto World 29',
          currency: 'DH',
          taxRate: 0,
          logoUrl: '/moto-world-logo.jpg',
        },
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { storeName, currency, taxRate, logoUrl } = body

    let settings = await db.settings.findUnique({ where: { id: '1' } })
    if (!settings) {
      settings = await db.settings.create({
        data: {
          id: '1',
          storeName: storeName ?? 'Moto World 29',
          currency: currency ?? 'DH',
          taxRate: Number(taxRate) || 0,
          logoUrl: logoUrl ?? '/moto-world-logo.jpg',
        },
      })
    } else {
      settings = await db.settings.update({
        where: { id: '1' },
        data: {
          ...(storeName !== undefined && { storeName }),
          ...(currency !== undefined && { currency }),
          ...(taxRate !== undefined && { taxRate: Number(taxRate) || 0 }),
          ...(logoUrl !== undefined && { logoUrl }),
        },
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports?type=dashboard  -> today + month stats, last 7 days chart, top products
// GET /api/reports?type=daily&date=YYYY-MM-DD  -> specific day breakdown
// GET /api/reports?type=monthly&year=YYYY&month=1-12  -> specific month breakdown
// GET /api/reports?type=range&from=YYYY-MM-DD&to=YYYY-MM-DD

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'dashboard'
    const tzOffset = searchParams.get('tz') // minutes

    // Use a base "today" in the user's timezone if tz is provided
    const now = new Date()
    let today = now
    if (tzOffset !== null) {
      const offsetMs = (Number(tzOffset) || 0) * 60 * 1000
      today = new Date(now.getTime() + offsetMs + now.getTimezoneOffset() * 60 * 1000)
    }

    if (type === 'dashboard') {
      const dayStart = startOfDay(today)
      const dayEnd = endOfDay(today)
      const monthStart = startOfMonth(today)
      const monthEnd = endOfMonth(today)

      // We need to compare sale.createdAt in UTC. Convert local day bounds to UTC bounds.
      // Sale times are stored as UTC. The user's "today" is in their tz.
      const utcDayStart = new Date(dayStart.getTime() - today.getTimezoneOffset() * 60 * 1000)
      const utcDayEnd = new Date(dayEnd.getTime() - today.getTimezoneOffset() * 60 * 1000)
      const utcMonthStart = new Date(monthStart.getTime() - today.getTimezoneOffset() * 60 * 1000)
      const utcMonthEnd = new Date(monthEnd.getTime() - today.getTimezoneOffset() * 60 * 1000)

      const [todaySales, monthSales, lowStockProducts, totalProducts, stockValue] = await Promise.all([
        db.sale.findMany({
          where: { createdAt: { gte: utcDayStart, lte: utcDayEnd } },
          include: { product: true },
        }),
        db.sale.findMany({
          where: { createdAt: { gte: utcMonthStart, lte: utcMonthEnd } },
          include: { product: true },
        }),
        db.product.findMany({
          where: { quantity: { lte: 5 } },
          take: 10,
          orderBy: { quantity: 'asc' },
        }),
        db.product.count(),
        db.product.findMany(),
      ])

      const todayRevenue = todaySales.reduce((s, x) => s + x.total, 0)
      const todayProfit = todaySales.reduce((s, x) => s + x.profit, 0)
      const todayCost = todaySales.reduce((s, x) => s + x.unitCost * x.quantity, 0)
      const todayCount = todaySales.length

      const monthRevenue = monthSales.reduce((s, x) => s + x.total, 0)
      const monthProfit = monthSales.reduce((s, x) => s + x.profit, 0)
      const monthCost = monthSales.reduce((s, x) => s + x.unitCost * x.quantity, 0)
      const monthCount = monthSales.length

      // last 7 days chart (using user's local day concept)
      const last7Days: Array<{ date: string; label: string; revenue: number; profit: number; cost: number }> = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const ds = startOfDay(d)
        const de = endOfDay(d)
        const utcS = new Date(ds.getTime() - today.getTimezoneOffset() * 60 * 1000)
        const utcE = new Date(de.getTime() - today.getTimezoneOffset() * 60 * 1000)
        const daySales = await db.sale.findMany({
          where: { createdAt: { gte: utcS, lte: utcE } },
        })
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        last7Days.push({
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          label: `${dayNames[d.getDay()]} ${d.getDate()}`,
          revenue: daySales.reduce((s, x) => s + x.total, 0),
          profit: daySales.reduce((s, x) => s + x.profit, 0),
          cost: daySales.reduce((s, x) => s + x.unitCost * x.quantity, 0),
        })
      }

      // top products this month
      const productMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>()
      for (const s of monthSales) {
        const key = s.productId
        if (!productMap.has(key)) {
          productMap.set(key, { name: s.product.name, quantity: 0, revenue: 0, profit: 0 })
        }
        const e = productMap.get(key)!
        e.quantity += s.quantity
        e.revenue += s.total
        e.profit += s.profit
      }
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // stock value
      const inventoryValue = stockValue.reduce(
        (s, p) => s + p.purchasePrice * p.quantity,
        0,
      )
      const potentialRevenue = stockValue.reduce(
        (s, p) => s + p.salePrice * p.quantity,
        0,
      )

      return NextResponse.json({
        today: {
          revenue: todayRevenue,
          cost: todayCost,
          profit: todayProfit,
          count: todayCount,
        },
        month: {
          revenue: monthRevenue,
          cost: monthCost,
          profit: monthProfit,
          count: monthCount,
        },
        last7Days,
        topProducts,
        lowStock: lowStockProducts,
        inventoryValue,
        potentialRevenue,
        totalProducts,
      })
    }

    if (type === 'daily') {
      const dateStr = searchParams.get('date')
      const d = dateStr ? new Date(dateStr + 'T00:00:00') : today
      const ds = startOfDay(d)
      const de = endOfDay(d)
      const utcS = new Date(ds.getTime() - d.getTimezoneOffset() * 60 * 1000)
      const utcE = new Date(de.getTime() - d.getTimezoneOffset() * 60 * 1000)

      const sales = await db.sale.findMany({
        where: { createdAt: { gte: utcS, lte: utcE } },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        sales,
        revenue: sales.reduce((s, x) => s + x.total, 0),
        cost: sales.reduce((s, x) => s + x.unitCost * x.quantity, 0),
        profit: sales.reduce((s, x) => s + x.profit, 0),
        count: sales.length,
      })
    }

    if (type === 'monthly') {
      const year = Number(searchParams.get('year') || today.getFullYear())
      const month = Number(searchParams.get('month') || today.getMonth() + 1) // 1-12
      const d = new Date(year, month - 1, 1)
      const ms = startOfMonth(d)
      const me = endOfMonth(d)
      const utcS = new Date(ms.getTime() - d.getTimezoneOffset() * 60 * 1000)
      const utcE = new Date(me.getTime() - d.getTimezoneOffset() * 60 * 1000)

      const sales = await db.sale.findMany({
        where: { createdAt: { gte: utcS, lte: utcE } },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      })

      // group by day
      const byDay = new Map<string, { revenue: number; profit: number; cost: number; count: number }>()
      for (const s of sales) {
        // Convert UTC sale time back to local day
        const localDate = new Date(s.createdAt.getTime() + d.getTimezoneOffset() * 60 * 1000)
        const key = `${localDate.getDate()}`
        if (!byDay.has(key)) byDay.set(key, { revenue: 0, profit: 0, cost: 0, count: 0 })
        const e = byDay.get(key)!
        e.revenue += s.total
        e.profit += s.profit
        e.cost += s.unitCost * s.quantity
        e.count += 1
      }

      return NextResponse.json({
        year,
        month,
        monthLabel: new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        sales,
        byDay: Array.from(byDay.entries()).map(([day, v]) => ({ day: Number(day), ...v })).sort((a, b) => a.day - b.day),
        revenue: sales.reduce((s, x) => s + x.total, 0),
        cost: sales.reduce((s, x) => s + x.unitCost * x.quantity, 0),
        profit: sales.reduce((s, x) => s + x.profit, 0),
        count: sales.length,
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Failed to build report' }, { status: 500 })
  }
}

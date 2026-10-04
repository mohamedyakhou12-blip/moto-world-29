// ============================================================
//  Database layer — SQLite (expo-sqlite)
//  نفس مخطط نسخة الكمبيوتر
// ============================================================

import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabase('custom.db')

// ============================================================
//  تهيئة قاعدة البيانات — إنشاء الجداول
// ============================================================
export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Products
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Product (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT DEFAULT 'PIECES',
            sku TEXT,
            purchasePrice REAL DEFAULT 0,
            salePrice REAL DEFAULT 0,
            quantity INTEGER DEFAULT 0,
            minQuantity INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now'))
          );
        `)
        // Receipts (Bons)
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Receipt (
            id TEXT PRIMARY KEY,
            number INTEGER UNIQUE,
            customerName TEXT,
            subtotal REAL DEFAULT 0,
            discount REAL DEFAULT 0,
            total REAL DEFAULT 0,
            profit REAL DEFAULT 0,
            itemCount INTEGER DEFAULT 0,
            note TEXT,
            createdAt TEXT DEFAULT (datetime('now'))
          );
        `)
        // Receipt items
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS ReceiptItem (
            id TEXT PRIMARY KEY,
            receiptId TEXT NOT NULL,
            productId TEXT NOT NULL,
            productName TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unitPrice REAL NOT NULL,
            unitCost REAL NOT NULL,
            total REAL NOT NULL,
            profit REAL NOT NULL,
            FOREIGN KEY (receiptId) REFERENCES Receipt(id) ON DELETE CASCADE,
            FOREIGN KEY (productId) REFERENCES Product(id)
          );
        `)
        // Purchases
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Purchase (
            id TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unitPrice REAL NOT NULL,
            total REAL NOT NULL,
            note TEXT,
            createdAt TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (productId) REFERENCES Product(id)
          );
        `)
        // Settings
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Settings (
            id TEXT PRIMARY KEY DEFAULT '1',
            storeName TEXT DEFAULT 'Moto World 29',
            currency TEXT DEFAULT 'دج',
            taxRate REAL DEFAULT 0,
            logoUrl TEXT
          );
        `)
        // Ensure settings row exists
        tx.executeSql(`INSERT OR IGNORE INTO Settings (id, storeName, currency, taxRate) VALUES ('1', 'Moto World 29', 'دج', 0);`)
      },
      (error) => {
        console.error('DB init error:', error)
        reject(error)
      },
      () => {
        console.log('DB initialized ✓')
        resolve()
      }
    )
  })
}

// ============================================================
//  Helper: تنفيذ query وإرجاع نتائج
// ============================================================
function execute(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result.rows._array),
          (_, error) => {
            console.error('SQL error:', error, 'in:', sql, 'params:', params)
            reject(error)
            return false
          }
        )
      },
      (error) => reject(error)
    )
  })
}

function executeRaw(sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          sql,
          params,
          (_, result) => resolve(result),
          (_, error) => {
            console.error('SQL error:', error, 'in:', sql, 'params:', params)
            reject(error)
            return false
          }
        )
      },
      (error) => reject(error)
    )
  })
}

// معرّف فريد (cuid-like)
function genId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ============================================================
//  Products
// ============================================================
export interface Product {
  id: string
  name: string
  category: string
  sku: string | null
  purchasePrice: number
  salePrice: number
  quantity: number
  minQuantity: number
  createdAt: string
  updatedAt: string
}

export const dbGetProducts = async (q = '', category = 'ALL'): Promise<Product[]> => {
  let sql = 'SELECT * FROM Product'
  const params: any[] = []
  const conditions: string[] = []
  if (q) {
    conditions.push('(name LIKE ? OR sku LIKE ?)')
    params.push('%' + q + '%', '%' + q + '%')
  }
  if (category && category !== 'ALL') {
    conditions.push('category = ?')
    params.push(category)
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY createdAt DESC'
  return execute(sql, params)
}

export const dbGetProduct = async (id: string): Promise<Product | null> => {
  const rows = await execute('SELECT * FROM Product WHERE id = ?', [id])
  return rows[0] || null
}

export const dbCreateProduct = async (p: Partial<Product>): Promise<Product> => {
  const id = genId()
  await executeRaw(
    `INSERT INTO Product (id, name, category, sku, purchasePrice, salePrice, quantity, minQuantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, p.name, p.category || 'PIECES', p.sku || null, p.purchasePrice || 0, p.salePrice || 0, p.quantity || 0, p.minQuantity || 0]
  )
  return (await dbGetProduct(id))!
}

export const dbUpdateProduct = async (id: string, p: Partial<Product>): Promise<void> => {
  const fields: string[] = []
  const params: any[] = []
  if (p.name !== undefined) { fields.push('name = ?'); params.push(p.name) }
  if (p.category !== undefined) { fields.push('category = ?'); params.push(p.category) }
  if (p.sku !== undefined) { fields.push('sku = ?'); params.push(p.sku) }
  if (p.purchasePrice !== undefined) { fields.push('purchasePrice = ?'); params.push(p.purchasePrice) }
  if (p.salePrice !== undefined) { fields.push('salePrice = ?'); params.push(p.salePrice) }
  if (p.quantity !== undefined) { fields.push('quantity = ?'); params.push(p.quantity) }
  if (p.minQuantity !== undefined) { fields.push('minQuantity = ?'); params.push(p.minQuantity) }
  fields.push("updatedAt = datetime('now')")
  params.push(id)
  await executeRaw(`UPDATE Product SET ${fields.join(', ')} WHERE id = ?`, params)
}

export const dbDeleteProduct = async (id: string): Promise<void> => {
  await executeRaw('DELETE FROM ReceiptItem WHERE productId = ?', [id])
  await executeRaw('DELETE FROM Purchase WHERE productId = ?', [id])
  await executeRaw('DELETE FROM Product WHERE id = ?', [id])
}

// ============================================================
//  Receipts (Bons)
// ============================================================
export interface ReceiptItem {
  id: string
  receiptId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  unitCost: number
  total: number
  profit: number
}

export interface Receipt {
  id: string
  number: number
  customerName: string | null
  subtotal: number
  discount: number
  total: number
  profit: number
  itemCount: number
  note: string | null
  createdAt: string
  items?: ReceiptItem[]
}

export const dbGetReceipts = async (): Promise<Receipt[]> => {
  return execute('SELECT * FROM Receipt ORDER BY createdAt DESC LIMIT 200')
}

export const dbGetReceipt = async (id: string): Promise<Receipt | null> => {
  const rows = await execute('SELECT * FROM Receipt WHERE id = ?', [id])
  if (!rows[0]) return null
  const items = await execute('SELECT * FROM ReceiptItem WHERE receiptId = ?', [id])
  return { ...rows[0], items }
}

interface CreateReceiptInput {
  customerName?: string
  discount?: number
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>
}

export const dbCreateReceipt = async (input: CreateReceiptInput): Promise<Receipt> => {
  // Get products
  const productIds = input.items.map((i) => i.productId)
  const placeholders = productIds.map(() => '?').join(',')
  const products: Product[] = await execute(`SELECT * FROM Product WHERE id IN (${placeholders})`, productIds)
  const productMap = new Map(products.map((p) => [p.id, p]))

  // Validate + compute
  let subtotal = 0
  let totalCost = 0
  let itemCount = 0
  const itemsData: Array<{ product: Product; qty: number; unitPrice: number; unitCost: number; total: number; profit: number }> = []

  for (const item of input.items) {
    const product = productMap.get(item.productId)
    if (!product) throw new Error('منتج غير موجود')
    if (product.quantity < item.quantity) throw new Error(`المخزون غير كافٍ لـ "${product.name}"`)
    const unitPrice = item.unitPrice !== undefined ? item.unitPrice : product.salePrice
    const unitCost = product.purchasePrice
    const total = unitPrice * item.quantity
    const profit = (unitPrice - unitCost) * item.quantity
    subtotal += total
    totalCost += unitCost * item.quantity
    itemCount += item.quantity
    itemsData.push({ product, qty: item.quantity, unitPrice, unitCost, total, profit })
  }

  const discountValue = input.discount || 0
  const finalTotal = Math.max(0, subtotal - discountValue)
  const profitRatio = subtotal > 0 ? finalTotal / subtotal : 1
  const finalProfit = (subtotal - totalCost) * profitRatio

  const receiptId = genId()

  // Transaction
  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Get next number
        tx.executeSql('SELECT COALESCE(MAX(number), 0) + 1 AS nextNum FROM Receipt', [], (_, r) => {
          const number = r.rows._array[0].nextNum
          tx.executeSql(
            `INSERT INTO Receipt (id, number, customerName, subtotal, discount, total, profit, itemCount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [receiptId, number, input.customerName?.trim() || null, subtotal, discountValue, finalTotal, finalProfit, itemCount]
          )
          for (const it of itemsData) {
            tx.executeSql(
              `INSERT INTO ReceiptItem (id, receiptId, productId, productName, quantity, unitPrice, unitCost, total, profit)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [genId(), receiptId, it.product.id, it.product.name, it.qty, it.unitPrice, it.unitCost, it.total, it.profit]
            )
            tx.executeSql('UPDATE Product SET quantity = quantity - ? WHERE id = ?', [it.qty, it.product.id])
          }
          return false
        })
      },
      (err) => reject(err),
      () => resolve()
    )
  })

  return (await dbGetReceipt(receiptId))!
}

export const dbDeleteReceipt = async (id: string): Promise<void> => {
  const items: ReceiptItem[] = await execute('SELECT * FROM ReceiptItem WHERE receiptId = ?', [id])
  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        for (const item of items) {
          tx.executeSql('UPDATE Product SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.productId])
        }
        tx.executeSql('DELETE FROM ReceiptItem WHERE receiptId = ?', [id])
        tx.executeSql('DELETE FROM Receipt WHERE id = ?', [id])
      },
      (err) => reject(err),
      () => resolve()
    )
  })
}

// ============================================================
//  Purchases
// ============================================================
export interface Purchase {
  id: string
  productId: string
  productName?: string
  quantity: number
  unitPrice: number
  total: number
  note: string | null
  createdAt: string
}

interface CreatePurchaseInput {
  productId?: string
  name?: string
  category?: string
  sku?: string
  quantity: number
  unitPrice?: number
  salePrice?: number
}

export const dbGetPurchases = async (): Promise<Purchase[]> => {
  return execute(
    `SELECT Purchase.*, Product.name AS productName FROM Purchase
     LEFT JOIN Product ON Purchase.productId = Product.id
     ORDER BY Purchase.createdAt DESC LIMIT 200`
  )
}

export const dbCreatePurchase = async (input: CreatePurchaseInput): Promise<Purchase> => {
  const id = genId()
  const qty = input.quantity
  const unitPrice = input.unitPrice || 0
  const total = unitPrice * qty

  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        if (input.productId) {
          // Existing product
          tx.executeSql(
            'INSERT INTO Purchase (id, productId, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)',
            [id, input.productId, qty, unitPrice, total]
          )
          tx.executeSql(
            'UPDATE Product SET quantity = quantity + ?, purchasePrice = ? WHERE id = ?',
            [qty, unitPrice, input.productId]
          )
        } else if (input.name) {
          // New product
          const productId = genId()
          tx.executeSql(
            `INSERT INTO Product (id, name, category, sku, purchasePrice, salePrice, quantity, minQuantity)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [productId, input.name, input.category || 'PIECES', input.sku || null, unitPrice, input.salePrice || 0, qty]
          )
          tx.executeSql(
            'INSERT INTO Purchase (id, productId, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)',
            [id, productId, qty, unitPrice, total]
          )
        } else {
          reject(new Error('Invalid input'))
          return false
        }
      },
      (err) => reject(err),
      () => resolve()
    )
  })

  const rows: Purchase[] = await execute(
    `SELECT Purchase.*, Product.name AS productName FROM Purchase
     LEFT JOIN Product ON Purchase.productId = Product.id
     WHERE Purchase.id = ?`,
    [id]
  )
  return rows[0]
}

export const dbDeletePurchase = async (id: string): Promise<void> => {
  const rows: Purchase[] = await execute('SELECT * FROM Purchase WHERE id = ?', [id])
  if (!rows[0]) return
  const purchase = rows[0]
  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('UPDATE Product SET quantity = MAX(0, quantity - ?) WHERE id = ?', [purchase.quantity, purchase.productId])
        tx.executeSql('DELETE FROM Purchase WHERE id = ?', [id])
      },
      (err) => reject(err),
      () => resolve()
    )
  })
}

// ============================================================
//  Reports
// ============================================================
export interface DashboardData {
  today: { revenue: number; cost: number; profit: number; count: number }
  month: { revenue: number; cost: number; profit: number; count: number }
  topProducts: Array<{ name: string; quantity: number; revenue: number; profit: number }>
  lowStock: Product[]
  inventoryValue: number
  potentialRevenue: number
  totalProducts: number
}

const todayLocalISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const monthStartISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01'
}

export const dbGetDashboard = async (): Promise<DashboardData> => {
  const today = todayLocalISO()
  const monthStart = monthStartISO()

  // SQLite stores createdAt as TEXT (datetime('now') = UTC). We compare date prefix.
  const todayReceipts: Receipt[] = await execute(
    `SELECT * FROM Receipt WHERE substr(createdAt, 1, 10) = ? ORDER BY createdAt DESC`,
    [today]
  )
  const monthReceipts: Receipt[] = await execute(
    `SELECT * FROM Receipt WHERE substr(createdAt, 1, 7) = ? ORDER BY createdAt DESC`,
    [today.slice(0, 7)]
  )

  const todayItems: ReceiptItem[] = await execute(
    `SELECT ReceiptItem.* FROM ReceiptItem
     JOIN Receipt ON ReceiptItem.receiptId = Receipt.id
     WHERE substr(Receipt.createdAt, 1, 10) = ?`,
    [today]
  )
  const monthItems: ReceiptItem[] = await execute(
    `SELECT ReceiptItem.* FROM ReceiptItem
     JOIN Receipt ON ReceiptItem.receiptId = Receipt.id
     WHERE substr(Receipt.createdAt, 1, 7) = ?`,
    [today.slice(0, 7)]
  )

  const todayRevenue = todayReceipts.reduce((s, r) => s + r.total, 0)
  const todayProfit = todayReceipts.reduce((s, r) => s + r.profit, 0)
  const todayCost = todayItems.reduce((s, i) => s + i.unitCost * i.quantity, 0)

  const monthRevenue = monthReceipts.reduce((s, r) => s + r.total, 0)
  const monthProfit = monthReceipts.reduce((s, r) => s + r.profit, 0)
  const monthCost = monthItems.reduce((s, i) => s + i.unitCost * i.quantity, 0)

  // Top products this month
  const topMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>()
  for (const item of monthItems) {
    if (!topMap.has(item.productId)) topMap.set(item.productId, { name: item.productName, quantity: 0, revenue: 0, profit: 0 })
    const e = topMap.get(item.productId)!
    e.quantity += item.quantity
    e.revenue += item.total
    e.profit += item.profit
  }
  const topProducts = Array.from(topMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // Low stock
  const lowStock = await execute('SELECT * FROM Product WHERE quantity <= 5 ORDER BY quantity ASC LIMIT 10')

  // Stock value
  const allProducts: Product[] = await execute('SELECT * FROM Product')
  const inventoryValue = allProducts.reduce((s, p) => s + p.purchasePrice * p.quantity, 0)
  const potentialRevenue = allProducts.reduce((s, p) => s + p.salePrice * p.quantity, 0)

  return {
    today: { revenue: todayRevenue, cost: todayCost, profit: todayProfit, count: todayReceipts.length },
    month: { revenue: monthRevenue, cost: monthCost, profit: monthProfit, count: monthReceipts.length },
    topProducts,
    lowStock,
    inventoryValue,
    potentialRevenue,
    totalProducts: allProducts.length,
  }
}

export interface DayReport {
  date: string
  receipts: Receipt[]
  revenue: number
  cost: number
  profit: number
  count: number
}

export interface MonthReport {
  year: number
  month: number
  monthLabel: string
  receipts: Receipt[]
  revenue: number
  cost: number
  profit: number
  count: number
  byDay: Array<{ day: number; revenue: number; profit: number; cost: number; count: number }>
}

const AR_MONTHS = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export const dbGetDayReport = async (dateStr: string): Promise<DayReport> => {
  const receipts: Receipt[] = await execute(
    `SELECT * FROM Receipt WHERE substr(createdAt, 1, 10) = ? ORDER BY createdAt DESC`,
    [dateStr]
  )
  const items: ReceiptItem[] = await execute(
    `SELECT ReceiptItem.* FROM ReceiptItem
     JOIN Receipt ON ReceiptItem.receiptId = Receipt.id
     WHERE substr(Receipt.createdAt, 1, 10) = ?`,
    [dateStr]
  )
  return {
    date: dateStr,
    receipts,
    revenue: receipts.reduce((s, r) => s + r.total, 0),
    cost: items.reduce((s, i) => s + i.unitCost * i.quantity, 0),
    profit: receipts.reduce((s, r) => s + r.profit, 0),
    count: receipts.length,
  }
}

export const dbGetMonthReport = async (year: number, month: number): Promise<MonthReport> => {
  const monthStr = String(year) + '-' + String(month).padStart(2, '0')
  const receipts: Receipt[] = await execute(
    `SELECT * FROM Receipt WHERE substr(createdAt, 1, 7) = ? ORDER BY createdAt DESC`,
    [monthStr]
  )
  const items: ReceiptItem[] = await execute(
    `SELECT ReceiptItem.*, substr(Receipt.createdAt, 9, 2) AS day FROM ReceiptItem
     JOIN Receipt ON ReceiptItem.receiptId = Receipt.id
     WHERE substr(Receipt.createdAt, 1, 7) = ?`,
    [monthStr]
  )

  const byDayMap = new Map<string, { revenue: number; profit: number; cost: number; count: number }>()
  for (const r of receipts) {
    const day = r.createdAt.slice(8, 10)
    if (!byDayMap.has(day)) byDayMap.set(day, { revenue: 0, profit: 0, cost: 0, count: 0 })
    const e = byDayMap.get(day)!
    e.revenue += r.total
    e.profit += r.profit
    e.count += 1
  }
  for (const item of items) {
    const day = (item as any).day
    if (!byDayMap.has(day)) byDayMap.set(day, { revenue: 0, profit: 0, cost: 0, count: 0 })
    const e = byDayMap.get(day)!
    e.cost += item.unitCost * item.quantity
  }

  const byDay = Array.from(byDayMap.entries())
    .map(([day, v]) => ({ day: Number(day), ...v }))
    .sort((a, b) => a.day - b.day)

  return {
    year,
    month,
    monthLabel: AR_MONTHS[month - 1] + ' ' + year,
    receipts,
    revenue: receipts.reduce((s, r) => s + r.total, 0),
    cost: items.reduce((s, i) => s + i.unitCost * i.quantity, 0),
    profit: receipts.reduce((s, r) => s + r.profit, 0),
    count: receipts.length,
    byDay,
  }
}

// ============================================================
//  Settings
// ============================================================
export interface Settings {
  id: string
  storeName: string
  currency: string
  taxRate: number
  logoUrl: string | null
}

export const dbGetSettings = async (): Promise<Settings> => {
  const rows = await execute("SELECT * FROM Settings WHERE id = '1'")
  return rows[0] || { id: '1', storeName: 'Moto World 29', currency: 'دج', taxRate: 0, logoUrl: null }
}

export const dbUpdateSettings = async (patch: Partial<Settings>): Promise<Settings> => {
  const fields: string[] = []
  const params: any[] = []
  if (patch.storeName !== undefined) { fields.push('storeName = ?'); params.push(patch.storeName) }
  if (patch.taxRate !== undefined) { fields.push('taxRate = ?'); params.push(patch.taxRate) }
  // Currency is LOCKED to دج
  fields.push("currency = 'دج'")
  if (fields.length) {
    params.push('1')
    await executeRaw(`UPDATE Settings SET ${fields.join(', ')} WHERE id = ?`, params)
  }
  return dbGetSettings()
}

// ============================================================
//  Reset
// ============================================================
export const dbResetAll = async (): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('DELETE FROM ReceiptItem')
        tx.executeSql('DELETE FROM Receipt')
        tx.executeSql('DELETE FROM Purchase')
        tx.executeSql('DELETE FROM Product')
      },
      (err) => reject(err),
      () => resolve()
    )
  })
}

// ============================================================
//  Seed demo data
// ============================================================
export const dbSeedDemo = async (): Promise<void> => {
  const count = await execute('SELECT COUNT(*) AS c FROM Product')
  if (count[0].c > 0) throw new Error('البيانات موجودة مسبقاً')

  const demos: Array<Partial<Product>> = [
    { name: 'فحمات فرامل أمامية YBR125', category: 'PIECES', sku: 'BRK-YBR125-F', purchasePrice: 1200, salePrice: 2200, quantity: 12, minQuantity: 5 },
    { name: 'سلسلة نقل الحركة 428H', category: 'PIECES', sku: 'CHN-428H', purchasePrice: 1800, salePrice: 3200, quantity: 8, minQuantity: 3 },
    { name: 'إطار خلفي 130/70-17', category: 'PIECES', sku: 'TIR-130-17', purchasePrice: 4500, salePrice: 7000, quantity: 6, minQuantity: 2 },
    { name: 'خوذة كاملة سوداء مطفية', category: 'EQUIPEMENTS', sku: 'HLM-FULL-BLK', purchasePrice: 8000, salePrice: 13500, quantity: 5, minQuantity: 2 },
    { name: 'قفازات جلدية للدراجة', category: 'EQUIPEMENTS', sku: 'GLV-LTHR-M', purchasePrice: 1800, salePrice: 3500, quantity: 10, minQuantity: 3 },
    { name: 'مرآة جانبية يمنى عالمية', category: 'ACCESSOIRES', sku: 'MIR-R-UNI', purchasePrice: 700, salePrice: 1500, quantity: 15, minQuantity: 5 },
    { name: 'وميض LED خلفي', category: 'ACCESSOIRES', sku: 'IND-LED-R', purchasePrice: 900, salePrice: 1900, quantity: 4, minQuantity: 4 },
    { name: 'فلتر هواء CG150', category: 'PIECES', sku: 'AIR-CG150', purchasePrice: 500, salePrice: 1100, quantity: 20, minQuantity: 5 },
  ]
  for (const d of demos) await dbCreateProduct(d)
}

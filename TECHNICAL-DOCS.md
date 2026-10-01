# 📖 التوثيق التقني الكامل — موتو ورلد 29 (Moto World 29)

> **هذا الملف مخصص لأي مساعد ذكي أو مبرمج** لفهم التطبيق وحل أي مشكلة.
> التطبيق: برنامج إدارة متجر قطع غيار دراجات نارية — Next.js 16 + Electron + SQLite.

---

## 📋 معلومات أساسية

- **اسم التطبيق:** موتو ورلد 29 (Moto World 29)
- **الإصدار:** 2.0
- **الغلاف:** GitHub Repository: `mohamedyakhou12-blip/moto-world-29`
- **التقنيات:** Next.js 16, TypeScript, Prisma + SQLite, Tailwind CSS 4, shadcn/ui, Electron 33
- **اللغة:** عربية (RTL) + خط Cairo
- **العملة:** دج (دينار جزائري — مقفولة)

---

## 🏗️ 1. بنية التطبيق (Architecture)

```
موتو ورلد 29.exe (تطبيق سطح مكتب)
│
├── Electron (يُنشئ نافذة أصلية)
│   └── electron/main.js يشغل Next.js standalone server في الخلفية
│       └── الخادم يتصل بقاعدة بيانات SQLite محلية
│
└── المستخدم يتفاعل مع النافذة ← النافذة تعرض localhost:PORT
```

### كيف يعمل التطبيق عند التشغيل:
1. المستخدم ينقر مرتين على `Moto World 29.exe`
2. Electron يبدأ (`electron/main.js`)
3. `main.js` ينسخ `template.db` إلى `AppData\Roaming\Moto World 29\custom.db` (أول تشغيل فقط)
4. `main.js` يبحث عن منفذ متاح (3000, 3001, 3002...)
5. `main.js` يشغل `server.js` كعملية Node.js خالصة (باستخدام `ELECTRON_RUN_AS_NODE=1`)
6. `main.js` ينتظر حتى يستجيب الخادم (HTTP 200)
7. `main.js` يفتح `BrowserWindow` تحمّل `http://127.0.0.1:PORT`
8. المستخدم يرى التطبيق

---

## 📂 2. هيكل الملفات

```
moto-world-29/
├── electron/                    ← ملفات Electron
│   ├── main.js                  ← العملية الرئيسية (يفتح النافذة + يشغل الخادم)
│   └── preload.js               ← سكربت أمان قبل تحميل الصفحة
│
├── scripts/
│   └── build-electron.js        ← ينسخ الملفات إلى .next/standalone/
│
├── prisma/
│   ├── schema.prisma            ← مخطط قاعدة البيانات
│   └── template.db              ← قاعدة بيانات فارغة (تُنسخ عند أول تشغيل)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← التخطيط الرئيسي (RTL + خط Cairo)
│   │   ├── page.tsx             ← الصفحة الرئيسية (نقطة الدخول)
│   │   ├── globals.css          ← أنماط Tailwind
│   │   └── api/                 ← واجهات API
│   │       ├── products/        ← المنتجات (CRUD + بحث)
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── receipts/        ← البونات/الفواتير (CRUD + طباعة)
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── purchases/       ← المشتريات (تزويد + قطع جديدة)
│   │       │   └── route.ts
│   │       ├── reports/         ← التقارير (يومي/شهري/dashboard)
│   │       │   └── route.ts
│   │       ├── settings/        ← الإعدادات
│   │       │   └── route.ts
│   │       ├── reset/           ← حذف كل البيانات
│   │       │   └── route.ts
│   │       └── seed/            ← بيانات تجريبية
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── moto/
│   │   │   ├── app-shell.tsx    ← القائمة الجانبية + الهيكل
│   │   │   ├── types.ts         ← أنواع TypeScript + hook useSettings
│   │   │   └── sections/
│   │   │       ├── dashboard.tsx    ← لوحة القيادة
│   │   │       ├── inventory.tsx    ← المخزون (بحث + CRUD)
│   │   │       ├── pos.tsx          ← نقطة البيع (إنشاء بون)
│   │   │       ├── purchases.tsx    ← المشتريات (تزويد)
│   │   │       ├── receipts.tsx     ← سجل البونات (بحث + طباعة)
│   │   │       ├── reports.tsx      ← التقارير
│   │   │       └── settings.tsx     ← الإعدادات
│   │   └── ui/                  ← مكونات shadcn/ui
│   │
│   └── lib/
│       ├── db.ts                ← عميل Prisma
│       ├── format.ts            ← دوال التنسيق (عملة، تاريخ، عربي)
│       └── utils.ts             ← أدوات مساعدة
│
├── public/                      ← ملفات ثابتة
│   ├── moto-world-logo.jpg      ← شعار التطبيق
│   └── manifest.json            ← PWA manifest
│
├── package.json                 ← الاعتماديات + سكربتات
├── next.config.ts               ← إعداد Next.js (output: "standalone")
├── .env.example                 ← مثال على متغيرات البيئة
├── .env.production              ← متغيرات بيئة الإنتاج
├── build.bat                    ← بناء exe بضغطة زر
├── run.bat                      ← تشغيل في المتصفح
├── BUILD-WINDOWS.md             ← دليل البناء
└── README.md                    ← دليل المشروع
```

---

## 🗄️ 3. قاعدة البيانات (Prisma + SQLite)

### المخطط الكامل (`prisma/schema.prisma`):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// المنتجات - القطع في المخزون
model Product {
  id            String         @id @default(cuid())
  name          String
  category      String         @default("PIECES")  // PIECES | ACCESSOIRES | EQUIPEMENTS
  sku           String?
  purchasePrice Float          @default(0)          // سعر الشراء
  salePrice     Float          @default(0)          // سعر البيع
  quantity      Int            @default(0)          // المخزون الحالي
  minQuantity   Int            @default(0)          // حد التنبيه
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  receiptItems  ReceiptItem[]
  purchases     Purchase[]
}

// البون (الفاتورة) - زبون يشتري عدة أشياء دفعة واحدة
model Receipt {
  id           String         @id @default(cuid())
  number       Int            @unique @default(1)   // رقم تسلسلي تلقائي
  customerName String?                              // اسم الزبون (اختياري)
  subtotal     Float          @default(0)           // المجموع قبل الخصم
  discount     Float          @default(0)           // خصم
  total        Float          @default(0)           // المجموع النهائي
  profit       Float          @default(0)           // صافي الربح
  itemCount    Int            @default(0)           // عدد القطع
  note         String?
  createdAt    DateTime       @default(now())
  items        ReceiptItem[]
}

// عناصر البون - كل قطعة في البون
model ReceiptItem {
  id          String   @id @default(cuid())
  receiptId   String
  receipt     Receipt  @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  productName String                          // نسخة من الاسم (للطباعة حتى لو حُذف المنتج)
  quantity    Int
  unitPrice   Float                            // سعر البيع وقت الشراء
  unitCost    Float                            // سعر الشراء وقت الشراء (لحساب الربح)
  total       Float                            // quantity * unitPrice
  profit      Float                            // (unitPrice - unitCost) * quantity
}

// المشتريات - تسجيل التزويد
model Purchase {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  quantity    Int
  unitPrice   Float                              // سعر الشراء
  total       Float                              // quantity * unitPrice
  note        String?
  createdAt   DateTime @default(now())
}

model Settings {
  id          String   @id @default("1")
  storeName   String   @default("Moto World 29")
  currency    String   @default("دج")              // مقفولة على الدينار الجزائري
  taxRate     Float    @default(0)
  logoUrl     String?
}
```

### موقع قاعدة البيانات:
- **أثناء التطوير:** `db/custom.db` (نسبي لمجلد المشروع)
- **في التطبيق المُجمّع:** `C:\Users\<USER>\AppData\Roaming\Moto World 29\custom.db`

### متغير البيئة:
```
DATABASE_URL=file:/absolute/path/to/custom.db
```

**⚠️ مهم:** يجب أن يكون المسار مطلقاً (absolute) في الإنتاج، وإلا سيفشل Prisma بـ "Unable to open database file".

---

## 🖥️ 4. Electron — العملية الرئيسية

### `electron/main.js` (الملف الأهم):

```javascript
const { app, BrowserWindow, shell, dialog } = require('electron')
const path = require('path')
const { spawn, execSync } = require('child_process')
const http = require('http')
const net = require('net')
const fs = require('fs')

let mainWindow = null
let serverProcess = null
let serverPort = 3000
let isQuitting = false

// 1. نظام السجل (يُهيأ بعد app.whenReady)
let logDir = null
let logFile = null

function initLogging() {
  logDir = path.join(app.getPath('userData'), 'logs')
  fs.mkdirSync(logDir, { recursive: true })
  logFile = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
}

function log(msg) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] ${msg}`
  console.log(line)
  try {
    if (logFile) fs.appendFileSync(logFile, line + '\n')
  } catch (e) {}
}

// 2. إدارة قاعدة البيانات
function getDatabaseUrl() {
  const userData = app.getPath('userData')
  const dbPath = path.join(userData, 'custom.db')

  if (!fs.existsSync(dbPath)) {
    const templatePath = app.isPackaged
      ? path.join(process.resourcesPath, 'template.db')
      : path.join(__dirname, '..', 'prisma', 'template.db')

    if (fs.existsSync(templatePath)) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true })
      fs.copyFileSync(templatePath, dbPath)
    }
  }
  return `file:${dbPath}`
}

// 3. إيجاد منفذ متاح
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    let port = startPort
    const tryPort = () => {
      const tester = net.createServer()
      tester.once('error', () => { port++; tryPort() })
      tester.once('listening', () => { tester.close(); resolve(port) })
      tester.listen(port, '127.0.0.1')
    }
    tryPort()
  })
}

// 4. تشغيل الخادم (CRITICAL)
function startServer() {
  return new Promise(async (resolve, reject) => {
    const dbUrl = getDatabaseUrl()
    serverPort = await findAvailablePort(3000)

    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js')
      : path.join(__dirname, '..', '.next', 'standalone', 'server.js')

    // ⚠️ CRITICAL: ELECTRON_RUN_AS_NODE=1
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',           // يجعل Electron يعمل كـ Node.js خالص
      DATABASE_URL: dbUrl,
      NODE_ENV: 'production',
      PORT: String(serverPort),
      HOSTNAME: '127.0.0.1',
      NEXT_TELEMETRY_DISABLED: '1',
    }

    serverProcess = spawn(process.execPath, [serverPath], {
      env: env,
      cwd: path.dirname(serverPath),
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    serverProcess.stdout.on('data', (data) => log('[server:out] ' + data.toString().trim()))
    serverProcess.stderr.on('data', (data) => log('[server:err] ' + data.toString().trim()))
    serverProcess.on('error', (err) => { if (!isQuitting) reject(err) })
    serverProcess.on('exit', (code, signal) => { serverProcess = null })

    // انتظر حتى يصبح الخادم جاهزاً
    let attempts = 0
    const checkServer = () => {
      const req = http.get(`http://127.0.0.1:${serverPort}/`, (res) => {
        if (res.statusCode < 500) { res.destroy(); resolve() }
        else { res.destroy(); retry() }
      })
      req.on('error', retry)
      req.setTimeout(2000, () => { req.destroy(); retry() })
    }
    const retry = () => {
      if (++attempts >= 60) reject(new Error('Server timeout'))
      else setTimeout(checkServer, 500)
    }
    setTimeout(checkServer, 1000)
  })
}

// 5. إنشاء النافذة
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 1024, minHeight: 650,
    backgroundColor: '#0a0a0a',
    title: 'موتو ورلد 29',
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`)
}

// 6. دورة الحياة
app.whenReady().then(async () => {
  initLogging()
  try {
    await startServer()
    createWindow()
  } catch (err) {
    dialog.showErrorBox('خطأ', err.message)
    app.quit()
  }
})

app.on('window-all-closed', () => { isQuitting = true; killServer(); app.quit() })
app.on('before-quit', () => { isQuitting = true; killServer() })

process.on('uncaughtException', (err) => {
  log('[FATAL] ' + err.message + '\n' + err.stack)
})
```

### ⚠️ النقاط الحرجة في `main.js`:

1. **`ELECTRON_RUN_AS_NODE=1`** — بدون هذا يحدث CPU 100% وحلقة لا نهائية
2. **مسار `server.js`** — يجب أن يكون `process.resourcesPath/app/.next/standalone/server.js`
3. **`DATABASE_URL`** — يجب أن يكون مساراً مطلقاً إلى `custom.db`
4. **لا تستخدم** `transparent: true` أو `frame: false` في `BrowserWindow` — يسبب نافذة سوداء على ويندوز
5. **لا تستخدم** `requestSingleInstanceLock()` في المستوى الأعلى — يسبب مشاكل
6. **لا تستخدم** `loadingWindow` مع `data:` URL — يفشل في Chromium

---

## 🔌 5. واجهات API (Endpoints)

### `GET /api/products?q=SEARCH&category=PIECES`
يرجع قائمة المنتجات (مع بحث اختياري).

### `POST /api/products`
```json
{
  "name": "فحمات فرامل",
  "category": "PIECES",
  "sku": "BRK-001",
  "purchasePrice": 1500,
  "salePrice": 2800,
  "quantity": 10,
  "minQuantity": 3
}
```

### `PUT /api/products/[id]`
تحديث منتج.

### `DELETE /api/products/[id]`
حذف منتج (يحذف ReceiptItems + Purchases المرتبطة أولاً في transaction).

### `GET /api/receipts`
يرجع كل البونات (مع items).

### `POST /api/receipts` — إنشاء بون
```json
{
  "customerName": "أحمد",
  "discount": 0,
  "items": [
    { "productId": "abc", "quantity": 2, "unitPrice": 2800 },
    { "productId": "xyz", "quantity": 1 }
  ]
}
```
- يحسب subtotal, total, profit
- يخصم من المخزون
- يرجع البون كاملاً مع items

### `GET /api/receipts/[id]`
يرجع بون واحد مع كل عناصره (للطباعة).

### `DELETE /api/receipts?id=...`
إلغاء بون (يُعيد القطع للمخزون في transaction).

### `POST /api/purchases` — تسجيل تزويد
- **قطعة موجودة:** `{ "items": [{ "productId": "abc", "quantity": 5, "unitPrice": 1500 }] }`
- **قطعة جديدة:** `{ "items": [{ "name": "قطعة جديدة", "category": "PIECES", "unitPrice": 1000, "salePrice": 2000, "quantity": 3 }] }`

### `GET /api/reports?type=dashboard&tz=180`
يرجع إحصائيات اليوم والشهر + آخر 7 أيام + top products + low stock.

### `GET /api/reports?type=daily&date=2026-09-30`
تقرير يومي مع كل البونات في ذلك اليوم.

### `GET /api/reports?type=monthly&year=2026&month=9`
تقرير شهري مع رسم بياني يومي.

### `GET /api/settings` / `PUT /api/settings`
قراءة/تحديث الإعدادات. **العملة مقفولة على "دج".**

### `POST /api/reset`
حذف كل البيانات (ReceiptItem → Receipt → Purchase → Product في transaction).

### `POST /api/seed`
تحميل بيانات تجريبية (8 منتجات + 11 بون).

---

## 🎨 6. الواجهة الأمامية (Frontend)

### الأقسام السبعة:
1. **لوحة القيادة** (`dashboard.tsx`) — KPIs اليوم/الشهر + رسم بياني 7 أيام + top products + low stock
2. **المخزون** (`inventory.tsx`) — جدول + بحث + CRUD + فلاتر فئة
3. **نقطة البيع** (`pos.tsx`) — إنشاء بون + سلة + اسم زبون + خصم + طباعة
4. **المشتريات** (`purchases.tsx`) — تزويد قطع موجودة + قطع جديدة بالشراء
5. **البونات** (`receipts.tsx`) — سجل + بحث برقم/اسم زبون + طباعة + إلغاء
6. **التقارير** (`reports.tsx`) — يومي/شهري + تنقل بين التواريخ
7. **الإعدادات** (`settings.tsx`) — اسم المتجر + العملة مقفولة + تحميل بيانات + reset

### التقنيات:
- **Next.js 16** (App Router)
- **TypeScript** 5
- **Tailwind CSS 4** + **shadcn/ui** (New York style)
- **Recharts** للرسوم البيانية
- **Lucide React** للأيقونات
- **خط Cairo** (عربي) من Google Fonts
- **RTL** (`dir="rtl" lang="ar"`)
- **العملة مقفولة على "دج"** في `src/lib/format.ts` و `src/app/api/settings/route.ts`

---

## 🔨 7. عملية البناء

### سكربت `npm run electron:build`:
```
next build → node scripts/build-electron.js → electron-builder --win
```

### `scripts/build-electron.js` يفعل:
1. ينسخ `.next/static` → `.next/standalone/.next/static`
2. ينسخ `public/` → `.next/standalone/public/`
3. ينسخ `electron/` → `.next/standalone/electron/`
4. ينسخ `prisma/` → `.next/standalone/prisma/`
5. ينسخ `package.json` → `.next/standalone/package.json`
6. ينسخ `node_modules/.prisma` → `.next/standalone/node_modules/.prisma`
7. ينسخ `node_modules/@prisma/client` → `.next/standalone/node_modules/@prisma/client`
8. ينسخ `node_modules/@prisma/engines` → `.next/standalone/node_modules/@prisma/engines`
9. ينشئ `prisma/template.db` (قاعدة فارغة)

### إعداد `electron-builder` في `package.json`:
```json
"build": {
  "appId": "com.motoworld29.app",
  "productName": "Moto World 29",
  "asar": false,
  "npmRebuild": false,
  "nodeGypRebuild": false,
  "buildDependenciesFromSource": false,
  "files": [
    "electron/**/*",
    ".next/standalone/**/*",
    "package.json"
  ],
  "extraResources": [
    { "from": "prisma/template.db", "to": "template.db" }
  ],
  "win": {
    "target": [{ "target": "portable", "arch": ["x64"] }]
  }
}
```

### الناتج: `dist/Moto World 29 1.0.0.exe`

---

## 🐛 8. المشاكل الشائعة وحلولها

### المشكلة 1: التطبيق لا يفتح (نافذة بيضاء/سوداء ثم تُغلق)

**الأسباب المحتملة:**
- `transparent: true` في BrowserWindow
- `requestSingleInstanceLock()` في المستوى الأعلى
- `loadingWindow` مع `frame: false`
- `data:` URL طويل في `loadURL`

**الحل:** تأكد أن `electron/main.js` لا يستخدم هذه الميزات.

### المشكلة 2: CPU 100% أو كراش

**السبب:** `spawn(process.execPath, [serverPath])` بدون `ELECTRON_RUN_AS_NODE=1`

**كيف يحدث:**
1. `process.execPath` = `Moto World 29.exe`
2. الكود يشغّل `Moto World 29.exe server.js`
3. Electron يرى ملف JS → يفتح نسخة جديدة من التطبيق
4. النسخة الجديدة تشغّل `main.js` مرة أخرى
5. التي تشغّل خادم آخر → **حلقة لا نهائية = CPU 100%**

**الحل:** أضف `ELECTRON_RUN_AS_NODE: '1'` في `env` عند `spawn`.

### المشكلة 3: "Unable to open the database file" (Prisma)

**السبب:** `DATABASE_URL` ليس مساراً مطلقاً

**الحل:** في `main.js`، استخدم `app.getPath('userData')` الذي يرجع مساراً مطلقاً:
```javascript
const dbPath = path.join(app.getPath('userData'), 'custom.db')
return `file:${dbPath}`
```

### المشكلة 4: "Could not find any Visual Studio installation"

**السبب:** electron-builder يحاول إعادة بناء وحدات Native (`@parcel/watcher`)

**الحل:** في `package.json`، تأكد أن:
```json
"npmRebuild": false,
"nodeGypRebuild": false,
"buildDependenciesFromSource": false
```

### المشكلة 5: Prisma engine غير موجود

**السبب:** `build-electron.js` لا ينسخ Prisma engine

**الحل:** تأكد أن `scripts/build-electron.js` ينسخ:
- `node_modules/.prisma` → `.next/standalone/node_modules/.prisma`
- `node_modules/@prisma/client` → `.next/standalone/node_modules/@prisma/client`
- `node_modules/@prisma/engines` → `.next/standalone/node_modules/@prisma/engines`

### المشكلة 6: الأيقونة لا تظهر

**السبب:** مسار الأيقونة غير صحيح في التطبيق المُجمّع

**الحل:** ابحث ديناميكياً:
```javascript
const iconPath = app.isPackaged
  ? path.join(process.resourcesPath, 'app', '.next', 'standalone', 'public', 'moto-world-logo.jpg')
  : path.join(__dirname, '..', 'public', 'moto-world-logo.jpg')
```

### المشكلة 7: حذف منتج يفشل (FK constraint)

**السبب:** المنتج له ReceiptItems أو Purchases مرتبطة

**الحل:** احذف المرتبط أولاً في transaction:
```javascript
await db.$transaction([
  db.receiptItem.deleteMany({ where: { productId: id } }),
  db.purchase.deleteMany({ where: { productId: id } }),
  db.product.delete({ where: { id } }),
])
```

---

## 📝 9. ملفات السجل (Logs)

عندما يفشل التطبيق، ابحث عن السجل في:
```
Windows: C:\Users\<USER>\AppData\Roaming\Moto World 29\logs\app-YYYY-MM-DD.log
```

### محتويات السجل:
- `[timestamp]` مع كل رسالة
- `[Server]` رسائل الخادم
- `[server:out]` stdout من الخادم
- `[server:err]` stderr من الخادم
- `[FATAL]` أخطاء قاتلة
- `process.execPath`, `userData`, `resourcesPath` (مفيدة للتشخيص)

---

## 🔄 10. أوامر مهمة

| الأمر | الوصف |
|-------|-------|
| `npm install` | تثبيت الاعتماديات |
| `npm run db:push` | إنشاء/تحديث قاعدة البيانات |
| `npm run dev` | تشغيل في المتصفح (تطوير) |
| `npm run build` | بناء Next.js فقط |
| `npm run electron:dev` | تشغيل في Electron (تطوير) |
| `npm run electron:build` | بناء ملف .exe |
| `npm run lint` | فحص الكود |

---

## 🎯 11. دليل للمساعد الذكي

### إذا سألك المستخدم عن مشكلة:

1. **اطلب منه نسخ ملف السجل** من:
   ```
   C:\Users\<USER>\AppData\Roaming\Moto World 29\logs\app-YYYY-MM-DD.log
   ```

2. **افحص السجل بحثاً عن:**
   - `[FATAL]` — أخطاء قاتلة
   - `[server:err]` — أخطاء الخادم
   - `ELECTRON_RUN_AS_NODE` — تأكد أنه موجود
   - `DATABASE_URL` — تأكد أنه مسار مطلق
   - `process.execPath` — يجب أن يكون مسار الـ exe

3. **المشاكل الأكثر شيوعاً:**
   - CPU 100% → `ELECTRON_RUN_AS_NODE` غير مفعّل
   - نافذة سوداء → `transparent: true` في BrowserWindow
   - Prisma error → `DATABASE_URL` ليس مطلق
   - server.js not found → `build-electron.js` لم ينسخ الملفات
   - حذف منتج يفشل → FK constraint (احذف المرتبط أولاً)

4. **ملفات مهمة لفحصها:**
   - `electron/main.js` — المنطق الرئيسي
   - `scripts/build-electron.js` — نسخ الملفات
   - `package.json` → `build` config — إعداد electron-builder
   - `prisma/schema.prisma` — مخطط قاعدة البيانات

---

## 🚀 12. إعداد التطوير المحلي

### المتطلبات:
- Node.js 18+ (أو Bun)
- Git

### التشغيل:
```bash
git clone https://github.com/mohamedyakhou12-blip/moto-world-29.git
cd moto-world-29
npm install
cp .env.example .env
npm run db:push
npm run dev
```
افتح: `http://localhost:3000`

### بناء .exe:
```bash
npm run electron:build
```
ستجد الملف في: `dist/Moto World 29 1.0.0.exe`

---

## 📊 13. حساب الأرباح

- **رقم المعاملات (CA)** = مجموع `total` كل البونات
- **تكلفة البضاعة (COGS)** = مجموع `unitCost * quantity` لكل ReceiptItem
- **صافي الربح** = `profit` كل البونات (يُحسب عند الإنشاء)
- **هامش الربح %** = (صافي الربح ÷ رقم المعاملات) × 100

### عند وجود خصم:
- `total = subtotal - discount`
- `profit = (subtotal - totalCost) * (total / subtotal)` — الربح يتناسب مع الخصم

---

## 🔒 14. ملاحظات أمنية

- **العملة مقفولة على "دج"** — لا يمكن للمستخدم تغييرها
- **البيانات محلية** — لا تُرسل عبر الإنترنت
- **لا يوجد مصادقة** — التطبيق لاستخدام فردي
- **قاعدة البيانات** في `AppData` — تبقى بعد التحديث

---

## 📞 15. معلومات الاتصال

- **GitHub:** https://github.com/mohamedyakhou12-blip/moto-world-29
- **اسم التطبيق:** موتو ورلد 29 (Moto World 29)
- **الإصدار:** 2.0

---

*هذا التوثيق يغطي كل جوانب التطبيق. أي مساعد ذكي يمكنه فهم التطبيق وحل المشاكل بناءً على هذا الملف.*

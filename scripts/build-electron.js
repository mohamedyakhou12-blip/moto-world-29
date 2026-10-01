// ============================================================
//  موتو ورلد 29 - سكربت البناء لـ Electron (يعمل على كل الأنظمة)
//  Moto World 29 - Cross-platform Electron build script
// ============================================================
// هذا السكربت ينسخ الملفات اللازمة إلى مجلد standalone
// This script copies required files to the standalone folder

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const standalone = path.join(root, '.next', 'standalone')

// ------------------------------------------------------------
// أداة نسخ المجلدات بشكل متكرر (تتخطى node_modules في المستوى الأعلى فقط)
// Recursive directory copy (skips top-level node_modules only)
// ------------------------------------------------------------
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ المصدر غير موجود: ${src}`)
    return false
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue // تجنب نسخ node_modules بالكامل
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
  return true
}

// نسخ كامل بدون تخطي node_modules (لازم لـ prisma CLI)
// Full copy without skipping node_modules (needed for prisma CLI)
function copyDirFull(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ المصدر غير موجود: ${src}`)
    return false
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirFull(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
  return true
}

// ------------------------------------------------------------
// 1. تأكد من وجود مجلد standalone
// ------------------------------------------------------------
console.log('\n====================================')
console.log('  بناء موتو ورلد 29 لـ Electron')
console.log('====================================\n')

if (!fs.existsSync(standalone)) {
  console.error('❌ مجلد standalone غير موجود. شغّل: npm run build أولاً')
  process.exit(1)
}

// ------------------------------------------------------------
// 2. انسخ .next/static إلى standalone/.next/static
// ------------------------------------------------------------
console.log('📁 نسخ الملفات الثابتة (.next/static)...')
copyDir(
  path.join(root, '.next', 'static'),
  path.join(standalone, '.next', 'static')
)
console.log('  ✓ تم')

// ------------------------------------------------------------
// 3. انسخ public إلى standalone/public
// ------------------------------------------------------------
console.log('📁 نسخ الملفات العامة (public)...')
copyDir(
  path.join(root, 'public'),
  path.join(standalone, 'public')
)
console.log('  ✓ تم')

// ------------------------------------------------------------
// 4. انسخ electron إلى standalone/electron
// ------------------------------------------------------------
console.log('📁 نسخ ملفات Electron...')
copyDir(
  path.join(root, 'electron'),
  path.join(standalone, 'electron')
)
console.log('  ✓ تم')

// ------------------------------------------------------------
// 5. انسخ prisma إلى standalone/prisma
// ------------------------------------------------------------
console.log('📁 نسخ مجلد Prisma...')
copyDir(
  path.join(root, 'prisma'),
  path.join(standalone, 'prisma')
)
console.log('  ✓ تم')

// ------------------------------------------------------------
// 6. انسخ package.json إلى standalone
// ------------------------------------------------------------
console.log('📁 نسخ package.json...')
fs.copyFileSync(
  path.join(root, 'package.json'),
  path.join(standalone, 'package.json')
)
console.log('  ✓ تم')

// ------------------------------------------------------------
// 7. انسخ عميل Prisma المُولّد (.prisma + @prisma/client)
// ------------------------------------------------------------
console.log('📁 نسخ عميل Prisma...')

// انسخ .prisma/client (العميل المُولّد + محرك الاستعلام) - FORCE OVERWRITE
const prismaGeneratedPath = path.join(root, 'node_modules', '.prisma')
const standalonePrismaGenPath = path.join(standalone, 'node_modules', '.prisma')
if (fs.existsSync(prismaGeneratedPath)) {
  // Remove existing first (might be a stub)
  if (fs.existsSync(standalonePrismaGenPath)) {
    fs.rmSync(standalonePrismaGenPath, { recursive: true, force: true })
  }
  fs.mkdirSync(path.dirname(standalonePrismaGenPath), { recursive: true })
  copyDirFull(prismaGeneratedPath, standalonePrismaGenPath)
  console.log('  ✓ تم نسخ .prisma/client (force overwrite)')
} else {
  console.warn('  ⚠ .prisma غير موجود — شغّل: npm run db:generate')
}

// انسخ @prisma/client - FORCE OVERWRITE (Next.js standalone creates a stub)
const prismaClientPkg = path.join(root, 'node_modules', '@prisma', 'client')
const standalonePrismaClient = path.join(standalone, 'node_modules', '@prisma', 'client')
if (fs.existsSync(prismaClientPkg)) {
  if (fs.existsSync(standalonePrismaClient)) {
    fs.rmSync(standalonePrismaClient, { recursive: true, force: true })
  }
  fs.mkdirSync(path.dirname(standalonePrismaClient), { recursive: true })
  copyDirFull(prismaClientPkg, standalonePrismaClient)
  console.log('  ✓ تم نسخ @prisma/client (force overwrite)')
}

// انسخ @prisma/engines - FORCE OVERWRITE
const prismaEnginesPath = path.join(root, 'node_modules', '@prisma', 'engines')
const standalonePrismaEngines = path.join(standalone, 'node_modules', '@prisma', 'engines')
if (fs.existsSync(prismaEnginesPath)) {
  if (fs.existsSync(standalonePrismaEngines)) {
    fs.rmSync(standalonePrismaEngines, { recursive: true, force: true })
  }
  fs.mkdirSync(path.dirname(standalonePrismaEngines), { recursive: true })
  copyDirFull(prismaEnginesPath, standalonePrismaEngines)
  console.log('  ✓ تم نسخ @prisma/engines (force overwrite)')
}

// انسخ prisma CLI (لازم لإنشاء الجداول عند أول تشغيل) - نسخ كامل
const prismaCliPath = path.join(root, 'node_modules', 'prisma')
const standalonePrismaCli = path.join(standalone, 'node_modules', 'prisma')
if (fs.existsSync(prismaCliPath)) {
  fs.mkdirSync(path.dirname(standalonePrismaCli), { recursive: true })
  copyDirFull(prismaCliPath, standalonePrismaCli)
  console.log('  ✓ تم نسخ prisma CLI (نسخ كامل)')
} else {
  console.warn('  ⚠ prisma CLI غير موجود في node_modules')
}

// ------------------------------------------------------------
// 8. أنشئ قاعدة بيانات نموذجية فارغة (template.db)
// ------------------------------------------------------------
console.log('🗄️ إنشاء قاعدة البيانات النموذجية...')
const templateDbPath = path.join(root, 'prisma', 'template.db')

// احذف القديم
if (fs.existsSync(templateDbPath)) {
  fs.unlinkSync(templateDbPath)
}

// Convert backslashes to forward slashes for Prisma (Windows fix)
const normalizedTemplatePath = templateDbPath.replace(/\\/g, '/')
console.log('  Template path: ' + templateDbPath)
console.log('  Normalized for Prisma: ' + normalizedTemplatePath)

try {
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: 'file:' + normalizedTemplatePath,
    },
    cwd: root,
    stdio: 'pipe',
  })
  console.log('  ✓ تم إنشاء template.db')
} catch (e) {
  console.error('  ❌ فشل إنشاء قاعدة البيانات النموذجية:', e.message)
  process.exit(1)
}

// Verify template.db has tables (not empty)
const stats = fs.statSync(templateDbPath)
console.log('  template.db size: ' + stats.size + ' bytes')
if (stats.size < 10000) {
  console.error('  ❌ template.db is too small (<' + 10000 + ' bytes) - tables may not be created!')
  console.error('  This means the database is empty and the app will not work.')
  process.exit(1)
} else {
  console.log('  ✓ template.db size OK (tables likely created)')
}

console.log('\n====================================')
console.log('  ✓ اكتمل البناء! جاهز لـ electron-builder')
console.log('====================================')
console.log('\nالخطوة التالية: npx electron-builder --win')
console.log('سيتم إنشاء ملف .exe في مجلد dist/\n')

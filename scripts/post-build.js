// ============================================================
//  post-build.js — يُشغّل بعد electron-builder
//  ينسخ .prisma و @prisma/client إلى dist\win-unpacked\resources\app\node_modules
//  لأن electron-builder يتخطى .prisma (مجلد مخفي)
// ============================================================

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const distAppNodeModules = path.join(root, 'dist', 'win-unpacked', 'resources', 'app', 'node_modules')

function copyDirFull(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('  WARN: source not found: ' + src)
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

console.log('')
console.log('====================================')
console.log('  Post-build: copy Prisma files')
console.log('====================================')
console.log('')

if (!fs.existsSync(distAppNodeModules)) {
  console.error('FAIL: dist\\win-unpacked\\resources\\app\\node_modules not found')
  console.error('Run electron-builder first')
  process.exit(1)
}

console.log('Target: ' + distAppNodeModules)
console.log('')

// 1. Copy .prisma (generated client + engine binary)
console.log('[1] Copying .prisma...')
const srcPrismaGen = path.join(root, 'node_modules', '.prisma')
const destPrismaGen = path.join(distAppNodeModules, '.prisma')
if (fs.existsSync(destPrismaGen)) {
  fs.rmSync(destPrismaGen, { recursive: true, force: true })
}
if (fs.existsSync(srcPrismaGen)) {
  copyDirFull(srcPrismaGen, destPrismaGen)
  console.log('  OK: .prisma copied')
} else {
  console.error('  FAIL: node_modules/.prisma not found. Run: npx prisma generate')
  process.exit(1)
}

// 2. Copy @prisma/client (full, not stub)
console.log('[2] Copying @prisma/client...')
const srcClient = path.join(root, 'node_modules', '@prisma', 'client')
const destClient = path.join(distAppNodeModules, '@prisma', 'client')
if (fs.existsSync(destClient)) {
  fs.rmSync(destClient, { recursive: true, force: true })
}
if (fs.existsSync(srcClient)) {
  copyDirFull(srcClient, destClient)
  console.log('  OK: @prisma/client copied')
} else {
  console.error('  FAIL: node_modules/@prisma/client not found')
  process.exit(1)
}

// 3. Copy @prisma/engines
console.log('[3] Copying @prisma/engines...')
const srcEngines = path.join(root, 'node_modules', '@prisma', 'engines')
const destEngines = path.join(distAppNodeModules, '@prisma', 'engines')
if (fs.existsSync(destEngines)) {
  fs.rmSync(destEngines, { recursive: true, force: true })
}
if (fs.existsSync(srcEngines)) {
  copyDirFull(srcEngines, destEngines)
  console.log('  OK: @prisma/engines copied')
} else {
  console.error('  FAIL: node_modules/@prisma/engines not found')
  process.exit(1)
}

// 4. Verify
console.log('')
console.log('Verification:')
const checks = [
  path.join(destPrismaGen, 'client', 'default.js'),
  path.join(destPrismaGen, 'client', 'index.js'),
  path.join(destClient, 'default.js'),
  path.join(destClient, 'index.js'),
]
let allOk = true
for (const c of checks) {
  const ok = fs.existsSync(c)
  console.log('  ' + (ok ? 'OK' : 'MISSING') + ' ' + c)
  if (!ok) allOk = false
}

// Check for engine binary
const engineFiles = fs.readdirSync(path.join(destPrismaGen, 'client')).filter(f => f.includes('engine'))
if (engineFiles.length > 0) {
  console.log('  OK: engine binary found: ' + engineFiles[0])
} else {
  console.log('  WARN: no engine binary in .prisma/client')
  allOk = false
}

console.log('')
if (allOk) {
  console.log('SUCCESS: All Prisma files copied')
} else {
  console.log('WARNING: Some files missing - app may not work')
}
console.log('')

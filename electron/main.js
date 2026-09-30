// ============================================================
//  موتو ورلد 29 - العملية الرئيسية لإلكترون (مُصلح بالكامل)
//  Moto World 29 - Electron Main Process (Fully Fixed)
// ============================================================

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

// ------------------------------------------------------------
// نظام السجل (يُهيأ بعد app.whenReady)
// ------------------------------------------------------------
let logDir = null
let logFile = null

function initLogging() {
  try {
    logDir = path.join(app.getPath('userData'), 'logs')
    fs.mkdirSync(logDir, { recursive: true })
    logFile = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
    log('=== بدء تسجيل الأخطاء ===')
  } catch (e) {
    console.error('Failed to init logging:', e)
  }
}

function log(msg) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] ${msg}`
  console.log(line)
  try {
    if (logFile) {
      fs.appendFileSync(logFile, line + '\n')
    }
  } catch (e) {
    // ignore
  }
}

// ------------------------------------------------------------
// إدارة قاعدة البيانات
// ------------------------------------------------------------
function getDatabaseUrl() {
  const userData = app.getPath('userData')
  const dbPath = path.join(userData, 'custom.db')

  if (!fs.existsSync(dbPath)) {
    let templatePath
    if (app.isPackaged) {
      templatePath = path.join(process.resourcesPath, 'template.db')
    } else {
      templatePath = path.join(__dirname, '..', 'prisma', 'template.db')
    }

    log('[DB] Looking for template at: ' + templatePath)

    if (fs.existsSync(templatePath)) {
      try {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true })
        fs.copyFileSync(templatePath, dbPath)
        log('[DB] تم إنشاء قاعدة البيانات من النموذج: ' + dbPath)
      } catch (e) {
        log('[DB] ERROR فشل نسخ قاعدة البيانات: ' + e.message)
      }
    } else {
      log('[DB] WARNING: قاعدة البيانات النموذجية غير موجودة')
    }
  } else {
    log('[DB] قاعدة البيانات موجودة: ' + dbPath)
  }

  return `file:${dbPath}`
}

// ------------------------------------------------------------
// إيجاد منفذ متاح
// ------------------------------------------------------------
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    let port = startPort
    const tryPort = () => {
      const tester = net.createServer()
      tester.once('error', () => {
        port++
        if (port > 3099) {
          resolve(3100)
          return
        }
        tryPort()
      })
      tester.once('listening', () => {
        tester.once('close', () => resolve(port))
        tester.close()
      })
      tester.listen(port, '127.0.0.1')
    }
    tryPort()
  })
}

// ------------------------------------------------------------
// تشغيل خادم Next.js
// ------------------------------------------------------------
function startServer() {
  return new Promise(async (resolve, reject) => {
    try {
      const dbUrl = getDatabaseUrl()
      serverPort = await findAvailablePort(3000)
      log('[Server] المنفذ المختار: ' + serverPort)

      // مسار server.js
      let serverPath
      if (app.isPackaged) {
        serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js')
      } else {
        serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js')
      }

      log('[Server] مسار الخادم: ' + serverPath)

      if (!fs.existsSync(serverPath)) {
        reject(new Error('لم يتم العثور على server.js:\n' + serverPath + '\n\nشغّل: npm run build'))
        return
      }

      // مجلد عمل الخادم
      const serverCwd = path.dirname(serverPath)
      log('[Server] مجلد العمل: ' + serverCwd)

      // ⚠️ CRITICAL: ELECTRON_RUN_AS_NODE=1
      // يجعل Electron يعمل كـ Node.js خالص بدون واجهة
      const env = {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        DATABASE_URL: dbUrl,
        NODE_ENV: 'production',
        PORT: String(serverPort),
        HOSTNAME: '127.0.0.1',
        NEXT_TELEMETRY_DISABLED: '1',
      }

      log('[Server] تشغيل الخادم...')
      log('[Server] execPath: ' + process.execPath)

      serverProcess = spawn(process.execPath, [serverPath], {
        env: env,
        cwd: serverCwd,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      serverProcess.stdout.on('data', (data) => {
        const text = data.toString().trim()
        if (text) log('[server:out] ' + text)
      })

      serverProcess.stderr.on('data', (data) => {
        const text = data.toString().trim()
        if (text) log('[server:err] ' + text)
      })

      serverProcess.on('error', (err) => {
        log('[Server] خطأ في التشغيل: ' + err.message)
        if (!isQuitting) reject(err)
      })

      serverProcess.on('exit', (code, signal) => {
        log('[Server] انتهت العملية: code=' + code + ' signal=' + signal)
        serverProcess = null
      })

      // انتظر حتى يصبح الخادم جاهزاً
      let attempts = 0
      const maxAttempts = 60 // 30 ثانية

      const checkServer = () => {
        const req = http.get(`http://127.0.0.1:${serverPort}/`, (res) => {
          log('[Server] استجابة HTTP: ' + res.statusCode)
          if (res.statusCode < 500) {
            log('[Server] الخادم جاهز ✓')
            res.destroy()
            resolve()
          } else {
            res.destroy()
            retry()
          }
        })

        req.on('error', (e) => {
          retry()
        })
        req.setTimeout(2000, () => {
          req.destroy()
          retry()
        })
      }

      const retry = () => {
        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error('الخادم لم يبدأ خلال 30 ثانية\nراجع السجل: ' + (logFile || 'logs/')))
        } else {
          setTimeout(checkServer, 500)
        }
      }

      // ابدأ الفحص بعد ثانية
      setTimeout(checkServer, 1000)
    } catch (err) {
      log('[Server] استثناء: ' + err.message + '\n' + err.stack)
      reject(err)
    }
  })
}

// ------------------------------------------------------------
// إيقاف الخادم
// ------------------------------------------------------------
function killServer() {
  if (!serverProcess) {
    log('[Server] لا توجد عملية لإيقافها')
    return
  }

  log('[Server] إيقاف الخادم... PID: ' + serverProcess.pid)
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' })
    } else {
      serverProcess.kill('SIGTERM')
      try { serverProcess.kill('SIGKILL') } catch (e) { /* ignore */ }
    }
  } catch (e) {
    log('[Server] خطأ أثناء الإيقاف: ' + e.message)
  }
  serverProcess = null
}

// ------------------------------------------------------------
// إنشاء النافذة الرئيسية
// ------------------------------------------------------------
function createWindow() {
  // مسار الأيقونة (مع fallback)
  let iconPath = null
  const possibleIcons = [
    app.isPackaged
      ? path.join(process.resourcesPath, 'app', '.next', 'standalone', 'public', 'moto-world-logo.jpg')
      : path.join(__dirname, '..', 'public', 'moto-world-logo.jpg'),
    app.isPackaged
      ? path.join(process.resourcesPath, 'app', 'public', 'moto-world-logo.jpg')
      : null,
  ].filter(Boolean)

  for (const p of possibleIcons) {
    if (fs.existsSync(p)) {
      iconPath = p
      log('[Window] أيقونة موجودة: ' + p)
      break
    }
  }
  if (!iconPath) {
    log('[Window] لم يتم العثور على الأيقونة، سيستخدم Electron أيقونة افتراضية')
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 650,
    backgroundColor: '#0a0a0a',
    title: 'موتو ورلد 29',
    ...(iconPath ? { icon: iconPath } : {}),
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = `http://127.0.0.1:${serverPort}`
  log('[Window] تحميل URL: ' + url)
  mainWindow.loadURL(url)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  log('[Window] تم إنشاء النافذة ✓')
}

// ------------------------------------------------------------
// دورة حياة التطبيق
// ------------------------------------------------------------
app.whenReady().then(async () => {
  initLogging()
  log('=== موتو ورلد 29 - بدء التشغيل ===')
  log('App packaged: ' + app.isPackaged)
  log('process.execPath: ' + process.execPath)
  log('process.resourcesPath: ' + (process.resourcesPath || 'N/A'))
  log('userData: ' + app.getPath('userData'))
  log('Platform: ' + process.platform)
  log('Arch: ' + process.arch)
  log('Electron version: ' + process.versions.electron)
  log('Node version: ' + process.versions.node)

  try {
    await startServer()
    log('[App] الخادم يعمل، إنشاء النافذة...')
    createWindow()
    log('[App] التطبيق يعمل بنجاح ✓')
  } catch (err) {
    log('[App] فشل التشغيل: ' + err.message)
    log('[App] Stack: ' + (err.stack || 'no stack'))
    dialog.showErrorBox(
      'خطأ في تشغيل موتو ورلد 29',
      'تعذر تشغيل التطبيق:\n\n' + err.message + '\n\nراجع ملف السجل:\n' + (logFile || app.getPath('userData'))
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  log('=== window-all-closed ===')
  isQuitting = true
  killServer()
  app.quit()
})

app.on('before-quit', () => {
  log('=== before-quit ===')
  isQuitting = true
  killServer()
})

process.on('exit', () => {
  killServer()
})

process.on('uncaughtException', (err) => {
  log('[FATAL] uncaughtException: ' + err.message + '\n' + err.stack)
  try {
    dialog.showErrorBox('خطأ قاتل', err.message + '\n\nراجع: ' + (logFile || ''))
  } catch (e) { /* ignore */ }
})

process.on('unhandledRejection', (reason) => {
  log('[FATAL] unhandledRejection: ' + String(reason))
})

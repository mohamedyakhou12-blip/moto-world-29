// ============================================================
//  موتو ورلد 29 - العملية الرئيسية لإلكترون (مُصلح)
//  Moto World 29 - Electron Main Process (FIXED)
// ============================================================
//
//  إصلاحات مهمة:
//  1. ELECTRON_RUN_AS_NODE=1 — يمنع الحلقة اللانهائية (CPU 100%)
//  2. منفذ ديناميكي — تجنب تعارض المنافذ
//  3. قفل نسخة واحدة — منع تشغيل عدة نسخ
//  4. سجل أخطاء في ملف — لتشخيص المشاكل
//  5. نافذة تحميل — أثناء تشغيل الخادم
//
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
let loadingWindow = null

// ------------------------------------------------------------
// نظام السجل (Logging to file for debugging)
// ------------------------------------------------------------
const logDir = app ? path.join(app.getPath('userData'), 'logs') : __dirname
let logFile = null

function log(msg) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] ${msg}`
  console.log(line)
  try {
    if (!logFile && logDir) {
      fs.mkdirSync(logDir, { recursive: true })
      logFile = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
    }
    if (logFile) {
      fs.appendFileSync(logFile, line + '\n')
    }
  } catch (e) {
    // ignore logging errors
  }
}

// ------------------------------------------------------------
// قفل نسخة واحدة (Single instance lock)
// ------------------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  log('App already running — quitting this instance')
  app.quit()
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
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

    if (fs.existsSync(templatePath)) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true })
      fs.copyFileSync(templatePath, dbPath)
      log('[DB] تم إنشاء قاعدة البيانات من النموذج: ' + dbPath)
    } else {
      log('[DB] WARNING: قاعدة البيانات النموججية غير موجودة: ' + templatePath)
    }
  }

  return `file:${dbPath}`
}

// ------------------------------------------------------------
// إيجاد منفذ متاح (Dynamic port finder)
// ------------------------------------------------------------
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      const tester = net.createServer()
      tester.once('error', () => {
        log('[Port] المنفذ ' + port + ' مستخدم، جرب التالي')
        tryPort(port + 1)
      })
      tester.once('listening', () => {
        tester.once('close', () => resolve(port))
        tester.close()
      })
      tester.listen(port, '127.0.0.1')
    }
    tryPort(startPort)
  })
}

// ------------------------------------------------------------
// تشغيل خادم Next.js كعملية Node.js خالصة (CRITICAL FIX)
// ------------------------------------------------------------
function startServer() {
  return new Promise(async (resolve, reject) => {
    const dbUrl = getDatabaseUrl()

    // إيجاد منفذ متاح
    serverPort = await findAvailablePort(3000)
    log('[Server] المنفذ المختار: ' + serverPort)

    // مسار server.js
    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js')
      : path.join(__dirname, '..', '.next', 'standalone', 'server.js')

    if (!fs.existsSync(serverPath)) {
      reject(new Error('لم يتم العثور على server.js. شغّل: npm run build أولاً\nالمسار المتوقع: ' + serverPath))
      return
    }

    log('[Server] تشغيل الخادم من: ' + serverPath)

    // ⚠️ CRITICAL FIX: ELECTRON_RUN_AS_NODE=1
    // هذا يجعل Electron يعمل كـ Node.js خالص بدون واجهة.
    // بدون هذا، Electron سيشغل نسخة جديدة من نفسه → حلقة لا نهائية → CPU 100% → كراش!
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      DATABASE_URL: dbUrl,
      NODE_ENV: 'production',
      PORT: String(serverPort),
      HOSTNAME: '127.0.0.1',
      // تعطيل file watching في الإنتاج
      NEXT_TELEMETRY_DISABLED: '1',
    }

    // المجلد الذي يعمل منه الخادم
    const serverCwd = path.dirname(serverPath)
    log('[Server] مجلد العمل: ' + serverCwd)

    try {
      serverProcess = spawn(process.execPath, [serverPath], {
        env: env,
        cwd: serverCwd,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (err) {
      reject(new Error('فشل تشغيل الخادم: ' + err.message))
      return
    }

    serverProcess.stdout.on('data', (data) => {
      const text = data.toString().trim()
      if (text) log('[server:out] ' + text)
    })

    serverProcess.stderr.on('data', (data) => {
      const text = data.toString().trim()
      if (text) log('[server:err] ' + text)
    })

    serverProcess.on('error', (err) => {
      log('[Server] خطأ: ' + err.message)
      reject(err)
    })

    serverProcess.on('exit', (code, signal) => {
      log('[Server] انتهت العملية: code=' + code + ' signal=' + signal)
      serverProcess = null
    })

    // انتظر حتى يصبح الخادم جاهزاً
    let attempts = 0
    const maxAttempts = 90 // 45 ثانية كحد أقصى

    const checkServer = () => {
      const req = http.get(`http://127.0.0.1:${serverPort}`, (res) => {
        if (res.statusCode < 500) {
          log('[Server] الخادم جاهز ✓')
          resolve()
        } else {
          retry()
        }
        req.destroy()
      })

      req.on('error', () => retry())
      req.setTimeout(1500, () => {
        req.destroy()
        retry()
      })
    }

    const retry = () => {
      attempts++
      if (attempts >= maxAttempts) {
        reject(new Error('الخادم لم يبدأ خلال 45 ثانية. راجع ملف السجل: ' + (logFile || 'logs/')))
      } else {
        setTimeout(checkServer, 500)
      }
    }

    setTimeout(checkServer, 1500)
  })
}

// ------------------------------------------------------------
// إيقاف الخادم (بقوة)
// ------------------------------------------------------------
function killServer() {
  if (!serverProcess) return

  log('[Server] إيقاف الخادم...')
  try {
    if (process.platform === 'win32') {
      // على ويندوز، اقتل شجرة العمليات كاملة
      execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' })
    } else {
      serverProcess.kill('SIGTERM')
      setTimeout(() => {
        try { serverProcess && serverProcess.kill('SIGKILL') } catch (e) { /* ignore */ }
      }, 2000)
    }
  } catch (e) {
    log('[Server] خطأ أثناء الإيقاف: ' + e.message)
  }
  serverProcess = null
}

// ------------------------------------------------------------
// نافذة التحميل (Loading window)
// ------------------------------------------------------------
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: true,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
    },
  })

  loadingWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, sans-serif;
          background: #0a0a0a;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          border-radius: 12px;
          border: 1px solid #dc2626;
        }
        .logo {
          width: 70px; height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626, #7f1d1d);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; font-weight: bold;
          margin-bottom: 20px;
          box-shadow: 0 0 30px rgba(220,38,38,0.5);
        }
        h1 { font-size: 18px; margin-bottom: 8px; }
        p { color: #a3a3a3; font-size: 12px; margin-bottom: 20px; }
        .spinner {
          width: 30px; height: 30px;
          border: 3px solid #262626;
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="logo">M29</div>
      <h1>موتو ورلد 29</h1>
      <p>جارٍ تشغيل التطبيق...</p>
      <div class="spinner"></div>
    </body>
    </html>
  `))

  loadingWindow.on('closed', () => { loadingWindow = null })
}

// ------------------------------------------------------------
// إنشاء النافذة الرئيسية
// ------------------------------------------------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 650,
    backgroundColor: '#0a0a0a',
    title: 'موتو ورلد 29',
    icon: path.join(__dirname, '..', 'public', 'moto-world-logo.jpg'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    if (loadingWindow) {
      loadingWindow.close()
      loadingWindow = null
    }
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`)

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
}

// ------------------------------------------------------------
// دورة حياة التطبيق
// ------------------------------------------------------------
app.whenReady().then(async () => {
  log('=== موتو ورلد 29 - بدء التشغيل ===')
  log('App packaged: ' + app.isPackaged)
  log('process.execPath: ' + process.execPath)
  log('userData: ' + app.getPath('userData'))

  // اعرض نافذة التحميل أولاً
  createLoadingWindow()

  try {
    await startServer()
    createWindow()
  } catch (err) {
    log('[App] فشل التشغيل: ' + err.message)
    if (loadingWindow) {
      loadingWindow.close()
      loadingWindow = null
    }
    dialog.showErrorBox(
      'خطأ في التشغيل',
      `تعذر تشغيل التطبيق:\n\n${err.message}\n\nراجع ملف السجل في:\n${logFile || app.getPath('userData')}`
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  log('=== window-all-closed ===')
  killServer()
  app.quit()
})

app.on('before-quit', () => {
  log('=== before-quit ===')
  killServer()
})

app.on('will-quit', () => {
  log('=== will-quit ===')
  killServer()
})

process.on('exit', () => {
  killServer()
})

process.on('SIGINT', () => {
  killServer()
  process.exit(0)
})

process.on('SIGTERM', () => {
  killServer()
  process.exit(0)
})

process.on('uncaughtException', (err) => {
  log('[FATAL] uncaughtException: ' + err.message + '\n' + err.stack)
})

// ============================================================
//  موتو ورلد 29 - العملية الرئيسية لإلكترون
//  Moto World 29 - Electron Main Process
//  يفتح نافذة أصلية حقيقية (ليست متصفحاً)
// ============================================================

const { app, BrowserWindow, shell, dialog } = require('electron')
const path = require('path')
const { spawn, execSync } = require('child_process')
const http = require('http')
const fs = require('fs')

let mainWindow = null
let serverProcess = null
let serverPort = 3000

// ------------------------------------------------------------
// إدارة قاعدة البيانات — تنشئ DB جذر في مجلد بيانات المستخدم
// Database management — creates DB in user data folder
// ------------------------------------------------------------
function getDatabaseUrl() {
  const userData = app.getPath('userData')
  const dbPath = path.join(userData, 'custom.db')

  // أول تشغيل: انسخ قاعدة البيانات النموذجية
  // First run: copy template database
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
      console.log('[DB] تم إنشاء قاعدة البيانات من النموذج:', dbPath)
    } else {
      console.error('[DB] قاعدة البيانات النموذجية غير موجودة:', templatePath)
    }
  }

  return `file:${dbPath}`
}

// ------------------------------------------------------------
// تشغيل خادم Next.js كعملية خلفية
// Start Next.js server as a background process
// ------------------------------------------------------------
function startServer() {
  return new Promise((resolve, reject) => {
    const dbUrl = getDatabaseUrl()

    // مسار server.js في النسخة المستقلة (standalone)
    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js')
      : path.join(__dirname, '..', '.next', 'standalone', 'server.js')

    if (!fs.existsSync(serverPath)) {
      reject(new Error('لم يتم العثور على server.js. شغّل: npm run build أولاً'))
      return
    }

    console.log('[Server] تشغيل الخادم من:', serverPath)

    // استخدم node لتشغيل server.js
    serverProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        NODE_ENV: 'production',
        PORT: String(serverPort),
        HOSTNAME: '127.0.0.1',
      },
      cwd: path.dirname(serverPath),
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    serverProcess.stdout.on('data', (data) => {
      console.log(`[server] ${data.toString().trim()}`)
    })

    serverProcess.stderr.on('data', (data) => {
      console.error(`[server:err] ${data.toString().trim()}`)
    })

    serverProcess.on('error', (err) => {
      console.error('[Server] خطأ في تشغيل الخادم:', err)
      reject(err)
    })

    // انتظر حتى يصبح الخادم جاهزاً
    let attempts = 0
    const maxAttempts = 60

    const checkServer = () => {
      const req = http.get(`http://127.0.0.1:${serverPort}`, (res) => {
        if (res.statusCode < 500) {
          console.log('[Server] الخادم جاهز ✓')
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
        reject(new Error('الخادم لم يبدأ خلال 30 ثانية'))
      } else {
        setTimeout(checkServer, 500)
      }
    }

    setTimeout(checkServer, 1000)
  })
}

// ------------------------------------------------------------
// إيقاف الخادم
// Stop the server
// ------------------------------------------------------------
function killServer() {
  if (!serverProcess) return

  try {
    if (process.platform === 'win32') {
      // على ويندوز، اقتل شجرة العمليات كاملة
      execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' })
    } else {
      serverProcess.kill('SIGTERM')
    }
  } catch (e) {
    // تجاهل الأخطاء — ربما انتهت العملية بالفعل
  }
  serverProcess = null
}

// ------------------------------------------------------------
// إنشاء النافذة الرئيسية
// Create the main window
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

  // اعرض النافذة فقط بعد تحميل المحتوى (لتجنب الشاشة البيضاء)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`)

  // افتح الروابط الخارجية في المتصفح
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
// App lifecycle
// ------------------------------------------------------------
app.whenReady().then(async () => {
  try {
    console.log('[App] جارٍ تشغيل موتو ورلد 29...')
    await startServer()
    createWindow()
  } catch (err) {
    console.error('[App] فشل التشغيل:', err)
    dialog.showErrorBox(
      'خطأ في التشغيل',
      `تعذر تشغيل التطبيق:\n\n${err.message}\n\nتأكد من تشغيل npm run build أولاً`
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  killServer()
  app.quit()
})

app.on('before-quit', () => {
  killServer()
})

app.on('will-quit', () => {
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

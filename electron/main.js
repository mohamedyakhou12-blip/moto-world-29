// ============================================================
//  موتو ورلد 29 - Electron Main Process (Bulletproof v3)
//  Handles ALL failure modes with maximum diagnostics
// ============================================================

const { app, BrowserWindow, shell, dialog } = require('electron')
const path = require('path')
const { spawn, execSync, exec } = require('child_process')
const http = require('http')
const net = require('net')
const fs = require('fs')
const os = require('os')

let mainWindow = null
let serverProcess = null
let serverPort = 3000
let isQuitting = false

// ------------------------------------------------------------
// نظام السجل — يعمل بأسرع ما يمكن
// ------------------------------------------------------------
let logDir = null
let logFile = null

function initLoggingEarly() {
  try {
    // Use a temp location before app is ready
    logDir = path.join(os.tmpdir(), 'moto-world-29-logs')
    fs.mkdirSync(logDir, { recursive: true })
    logFile = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
    log('=== Logging started (early) ===')
    log('OS: ' + os.platform() + ' ' + os.arch())
    log('Node: ' + process.versions.node)
    log('Electron: ' + process.versions.electron)
    log('execPath: ' + process.execPath)
    log('cwd: ' + process.cwd())
  } catch (e) {
    console.error('Failed to init logging:', e)
  }
}

function initLoggingFull() {
  try {
    const userLogDir = path.join(app.getPath('userData'), 'logs')
    fs.mkdirSync(userLogDir, { recursive: true })
    const newLogFile = path.join(userLogDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
    // Copy old log content to new location
    if (logFile && fs.existsSync(logFile)) {
      const oldContent = fs.readFileSync(logFile, 'utf8')
      fs.appendFileSync(newLogFile, oldContent)
    }
    logFile = newLogFile
    logDir = userLogDir
    log('=== Logging moved to userData: ' + logFile + ' ===')
  } catch (e) {
    log('Failed to move logging: ' + e.message)
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

// Start logging IMMEDIATELY
initLoggingEarly()

// ------------------------------------------------------------
// إدارة قاعدة البيانات — مع fallback
// ------------------------------------------------------------
function getDatabaseUrl() {
  let userData
  try {
    userData = app.getPath('userData')
  } catch (e) {
    userData = path.join(os.tmpdir(), 'moto-world-29')
    fs.mkdirSync(userData, { recursive: true })
  }

  const dbPath = path.join(userData, 'custom.db')
  log('[DB] userData: ' + userData)
  log('[DB] dbPath: ' + dbPath)

  if (!fs.existsSync(dbPath)) {
    log('[DB] custom.db does not exist, creating from template...')

    let templatePath = null
    const candidates = []

    if (app.isPackaged) {
      candidates.push(path.join(process.resourcesPath, 'template.db'))
      candidates.push(path.join(process.resourcesPath, 'app', 'prisma', 'template.db'))
      candidates.push(path.join(process.resourcesPath, 'app', '.next', 'standalone', 'prisma', 'template.db'))
    } else {
      candidates.push(path.join(__dirname, '..', 'prisma', 'template.db'))
    }

    log('[DB] Template candidates:')
    for (const c of candidates) {
      const exists = fs.existsSync(c)
      log('  ' + (exists ? 'OK' : 'NO') + ' ' + c)
      if (exists && !templatePath) templatePath = c
    }

    if (templatePath) {
      try {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true })
        fs.copyFileSync(templatePath, dbPath)
        const size = fs.statSync(dbPath).size
        log('[DB] Copied template. Size: ' + size + ' bytes')
        if (size < 1000) {
          log('[DB] WARNING: template.db is very small, may be empty')
        }
      } catch (e) {
        log('[DB] ERROR copying template: ' + e.message)
        log('[DB] Stack: ' + e.stack)
      }
    } else {
      log('[DB] ERROR: No template.db found anywhere!')
      log('[DB] Will create empty file - app may not work correctly')
      try {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true })
        fs.writeFileSync(dbPath, '')
      } catch (e) {
        log('[DB] ERROR creating empty DB: ' + e.message)
      }
    }
  } else {
    const size = fs.statSync(dbPath).size
    log('[DB] custom.db exists. Size: ' + size + ' bytes')
  }

  // CRITICAL: Convert backslashes to forward slashes for Prisma on Windows
  const normalizedPath = dbPath.replace(/\\/g, '/')
  const dbUrl = 'file:' + normalizedPath
  log('[DB] DATABASE_URL: ' + dbUrl)
  return dbUrl
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
        if (port > 3099) { resolve(3100); return }
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
      log('[Server] Port: ' + serverPort)

      // Find server.js - try multiple locations
      let serverPath = null
      const serverCandidates = []

      if (app.isPackaged) {
        serverCandidates.push(path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js'))
        serverCandidates.push(path.join(process.resourcesPath, '.next', 'standalone', 'server.js'))
      } else {
        serverCandidates.push(path.join(__dirname, '..', '.next', 'standalone', 'server.js'))
      }

      log('[Server] Looking for server.js:')
      for (const c of serverCandidates) {
        const exists = fs.existsSync(c)
        log('  ' + (exists ? 'OK' : 'NO') + ' ' + c)
        if (exists && !serverPath) serverPath = c
      }

      if (!serverPath) {
        reject(new Error('server.js not found in any location'))
        return
      }

      const serverCwd = path.dirname(serverPath)
      log('[Server] cwd: ' + serverCwd)

      // List what's in cwd for debugging
      try {
        const files = fs.readdirSync(serverCwd)
        log('[Server] cwd contents: ' + files.slice(0, 20).join(', '))
      } catch (e) {
        log('[Server] Could not list cwd: ' + e.message)
      }

      // CRITICAL: ELECTRON_RUN_AS_NODE=1
      const env = {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        DATABASE_URL: dbUrl,
        NODE_ENV: 'production',
        PORT: String(serverPort),
        HOSTNAME: '127.0.0.1',
        NEXT_TELEMETRY_DISABLED: '1',
      }

      log('[Server] Spawning: ' + process.execPath + ' ' + serverPath)

      serverProcess = spawn(process.execPath, [serverPath], {
        env: env,
        cwd: serverCwd,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      log('[Server] PID: ' + serverProcess.pid)

      serverProcess.stdout.on('data', (data) => {
        const text = data.toString().trim()
        if (text) {
          log('[server:out] ' + text)
        }
      })

      serverProcess.stderr.on('data', (data) => {
        const text = data.toString().trim()
        if (text) {
          log('[server:err] ' + text)
        }
      })

      serverProcess.on('error', (err) => {
        log('[Server] spawn error: ' + err.message)
        if (!isQuitting) reject(err)
      })

      serverProcess.on('exit', (code, signal) => {
        log('[Server] exit: code=' + code + ' signal=' + signal)
        if (code !== 0 && code !== null && !isQuitting) {
          reject(new Error('Server exited early (code=' + code + '). Check log: ' + logFile))
        }
        serverProcess = null
      })

      // Wait for server to be ready
      let attempts = 0
      const maxAttempts = 60

      const checkServer = () => {
        const req = http.get('http://127.0.0.1:' + serverPort + '/', (res) => {
          log('[Server] HTTP response: ' + res.statusCode)
          if (res.statusCode < 500) {
            res.destroy()
            log('[Server] Ready!')
            resolve()
          } else {
            res.destroy()
            retry()
          }
        })
        req.on('error', () => retry())
        req.setTimeout(2000, () => { req.destroy(); retry() })
      }

      const retry = () => {
        attempts++
        if (attempts >= maxAttempts) {
          const logContent = logFile && fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : 'no log'
          reject(new Error('Server not ready after 30s.\n\nLog:\n' + logContent.slice(-2000)))
        } else {
          setTimeout(checkServer, 500)
        }
      }

      setTimeout(checkServer, 1000)
    } catch (err) {
      log('[Server] Exception: ' + err.message + '\n' + err.stack)
      reject(err)
    }
  })
}

// ------------------------------------------------------------
// إيقاف الخادم
// ------------------------------------------------------------
function killServer() {
  if (!serverProcess) return
  log('[Server] Killing PID: ' + serverProcess.pid)
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /pid ' + serverProcess.pid + ' /T /F', { stdio: 'ignore' })
    } else {
      serverProcess.kill('SIGTERM')
      try { serverProcess.kill('SIGKILL') } catch (e) {}
    }
  } catch (e) {
    log('[Server] Kill error: ' + e.message)
  }
  serverProcess = null
}

// ------------------------------------------------------------
// إنشاء النافذة
// ------------------------------------------------------------
function createWindow() {
  let iconPath = null
  const iconCandidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'app', '.next', 'standalone', 'public', 'moto-world-logo.jpg'),
        path.join(process.resourcesPath, 'app', 'public', 'moto-world-logo.jpg'),
      ]
    : [path.join(__dirname, '..', 'public', 'moto-world-logo.jpg')]

  for (const p of iconCandidates) {
    if (fs.existsSync(p)) { iconPath = p; log('[Window] Icon: ' + p); break }
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 650,
    backgroundColor: '#0a0a0a',
    title: 'Moto World 29',
    ...(iconPath ? { icon: iconPath } : {}),
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = 'http://127.0.0.1:' + serverPort
  log('[Window] Loading: ' + url)
  mainWindow.loadURL(url)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) { shell.openExternal(url); return { action: 'deny' } }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
  log('[Window] Created')
}

// ------------------------------------------------------------
// دورة الحياة
// ------------------------------------------------------------
app.whenReady().then(async () => {
  initLoggingFull()
  log('=== Moto World 29 starting ===')
  log('Packaged: ' + app.isPackaged)
  log('resourcesPath: ' + (process.resourcesPath || 'N/A'))
  log('userData: ' + app.getPath('userData'))

  try {
    await startServer()
    log('[App] Server running, creating window...')
    createWindow()
    log('[App] App running')
  } catch (err) {
    log('[App] FAILED: ' + err.message)
    log('[App] Stack: ' + (err.stack || 'no stack'))

    // Show error WITH the log content
    let logContent = ''
    try {
      if (logFile && fs.existsSync(logFile)) {
        logContent = fs.readFileSync(logFile, 'utf8')
      }
    } catch (e) {}

    const errorMessage = err.message +
      '\n\n=== LOG (last 2000 chars) ===\n' +
      (logContent.slice(-2000) || 'no log')

    dialog.showErrorBox('Moto World 29 - Error', errorMessage)
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
  isQuitting = true
  killServer()
})

process.on('exit', () => { killServer() })

process.on('uncaughtException', (err) => {
  log('[FATAL] uncaughtException: ' + err.message + '\n' + err.stack)
  try {
    dialog.showErrorBox('Fatal Error', err.message + '\n\nLog: ' + (logFile || ''))
  } catch (e) {}
})

process.on('unhandledRejection', (reason) => {
  log('[FATAL] unhandledRejection: ' + String(reason))
})

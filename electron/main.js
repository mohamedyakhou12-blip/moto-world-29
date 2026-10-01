// ============================================================
//  موتو ورلد 29 - Electron Main Process (Self-Healing v4)
//  Creates database tables automatically at startup
// ============================================================

const { app, BrowserWindow, shell, dialog } = require('electron')
const path = require('path')
const { spawn, spawnSync, execSync } = require('child_process')
const http = require('http')
const net = require('net')
const fs = require('fs')
const os = require('os')

let mainWindow = null
let serverProcess = null
let serverPort = 3000
let isQuitting = false

// ------------------------------------------------------------
// نظام السجل
// ------------------------------------------------------------
let logDir = null
let logFile = null

function initLoggingEarly() {
  try {
    logDir = path.join(os.tmpdir(), 'moto-world-29-logs')
    fs.mkdirSync(logDir, { recursive: true })
    logFile = path.join(logDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
    log('=== Logging started (early) ===')
    log('OS: ' + os.platform() + ' ' + os.arch())
    log('Node: ' + process.versions.node)
    log('Electron: ' + process.versions.electron)
    log('execPath: ' + process.execPath)
  } catch (e) {
    console.error('Failed to init logging:', e)
  }
}

function initLoggingFull() {
  try {
    const userLogDir = path.join(app.getPath('userData'), 'logs')
    fs.mkdirSync(userLogDir, { recursive: true })
    const newLogFile = path.join(userLogDir, `app-${new Date().toISOString().slice(0, 10)}.log`)
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
    if (logFile) fs.appendFileSync(logFile, line + '\n')
  } catch (e) {}
}

initLoggingEarly()

// ------------------------------------------------------------
// قاعدة البيانات - إنشاء الجداول تلقائياً
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

  const normalizedPath = dbPath.replace(/\\/g, '/')
  const dbUrl = 'file:' + normalizedPath
  log('[DB] DATABASE_URL: ' + dbUrl)
  return { dbUrl, dbPath, normalizedPath }
}

// ------------------------------------------------------------
// إنشاء الجداول باستخدام prisma db push
// ------------------------------------------------------------
function ensureDatabaseTables() {
  const { dbUrl, dbPath } = getDatabaseUrl()

  // Find prisma CLI in standalone
  let prismaCliPath = null
  let schemaPath = null
  let prismaCwd = null

  const candidates = []

  if (app.isPackaged) {
    candidates.push({
      cli: path.join(process.resourcesPath, 'app', '.next', 'standalone', 'node_modules', 'prisma', 'build', 'index.js'),
      schema: path.join(process.resourcesPath, 'app', '.next', 'standalone', 'prisma', 'schema.prisma'),
      cwd: path.join(process.resourcesPath, 'app', '.next', 'standalone'),
    })
    candidates.push({
      cli: path.join(process.resourcesPath, 'app', 'node_modules', 'prisma', 'build', 'index.js'),
      schema: path.join(process.resourcesPath, 'app', 'prisma', 'schema.prisma'),
      cwd: path.join(process.resourcesPath, 'app'),
    })
  } else {
    candidates.push({
      cli: path.join(__dirname, '..', 'node_modules', 'prisma', 'build', 'index.js'),
      schema: path.join(__dirname, '..', 'prisma', 'schema.prisma'),
      cwd: path.join(__dirname, '..'),
    })
  }

  log('[DB] Looking for prisma CLI:')
  for (const c of candidates) {
    const cliExists = fs.existsSync(c.cli)
    const schemaExists = fs.existsSync(c.schema)
    log('  CLI ' + (cliExists ? 'OK' : 'NO') + ' ' + c.cli)
    log('  Schema ' + (schemaExists ? 'OK' : 'NO') + ' ' + c.schema)
    if (cliExists && schemaExists && !prismaCliPath) {
      prismaCliPath = c.cli
      schemaPath = c.schema
      prismaCwd = c.cwd
    }
  }

  if (!prismaCliPath) {
    log('[DB] ERROR: prisma CLI not found!')
    return { dbUrl, error: 'prisma CLI not found' }
  }

  log('[DB] Using prisma CLI: ' + prismaCliPath)
  log('[DB] Using schema: ' + schemaPath)
  log('[DB] Using cwd: ' + prismaCwd)

  // Run prisma db push to create tables using spawnSync (no shell, direct execution)
  try {
    log('[DB] Running prisma db push...')
    log('[DB] execPath: ' + process.execPath)
    log('[DB] cliPath: ' + prismaCliPath)
    log('[DB] schemaPath: ' + schemaPath)

    const result = spawnSync(process.execPath, [
      prismaCliPath,
      'db', 'push',
      '--accept-data-loss',
      '--skip-generate',
      '--schema=' + schemaPath,
    ], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        DATABASE_URL: dbUrl,
      },
      cwd: prismaCwd,
      windowsHide: true,
      timeout: 60000,
      encoding: 'utf8',
    })

    log('[DB] prisma db push exit code: ' + result.status)
    if (result.stdout) log('[DB] stdout: ' + result.stdout.trim().slice(-500))
    if (result.stderr) log('[DB] stderr: ' + result.stderr.trim().slice(-500))

    if (result.status !== 0) {
      log('[DB] prisma db push FAILED')
      return { dbUrl, error: 'prisma db push failed (exit ' + result.status + ')' }
    }

    // Verify
    if (fs.existsSync(dbPath)) {
      const size = fs.statSync(dbPath).size
      log('[DB] custom.db created. Size: ' + size + ' bytes')
      if (size < 10000) {
        log('[DB] WARNING: db too small, tables may not exist')
        return { dbUrl, error: 'database too small' }
      }
      log('[DB] Database ready with tables')
      return { dbUrl, error: null }
    } else {
      log('[DB] ERROR: custom.db was not created')
      return { dbUrl, error: 'custom.db not created' }
    }
  } catch (e) {
    log('[DB] ERROR running prisma db push: ' + e.message)
    log('[DB] Stack: ' + e.stack)
    return { dbUrl, error: e.message }
  }
}

// ------------------------------------------------------------
// إيجاد منفذ متاح
// ------------------------------------------------------------
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    let port = startPort
    const tryPort = () => {
      const tester = net.createServer()
      tester.once('error', () => { port++; if (port > 3099) { resolve(3100); return }; tryPort() })
      tester.once('listening', () => { tester.once('close', () => resolve(port)); tester.close() })
      tester.listen(port, '127.0.0.1')
    }
    tryPort()
  })
}

// ------------------------------------------------------------
// تشغيل خادم Next.js
// ------------------------------------------------------------
function startServer(dbUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      serverPort = await findAvailablePort(3000)
      log('[Server] Port: ' + serverPort)

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
        reject(new Error('server.js not found'))
        return
      }

      const serverCwd = path.dirname(serverPath)
      log('[Server] cwd: ' + serverCwd)

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
        if (text) log('[server:out] ' + text)
      })

      serverProcess.stderr.on('data', (data) => {
        const text = data.toString().trim()
        if (text) log('[server:err] ' + text)
      })

      serverProcess.on('error', (err) => {
        log('[Server] spawn error: ' + err.message)
        if (!isQuitting) reject(err)
      })

      serverProcess.on('exit', (code, signal) => {
        log('[Server] exit: code=' + code + ' signal=' + signal)
        if (code !== 0 && code !== null && !isQuitting) {
          reject(new Error('Server exited early (code=' + code + ')'))
        }
        serverProcess = null
      })

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
    if (fs.existsSync(p)) { iconPath = p; break }
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
    // CRITICAL: Create database tables BEFORE starting server
    log('[App] Step 1: Ensure database tables exist...')
    const dbResult = ensureDatabaseTables()
    if (dbResult.error) {
      log('[App] DB warning: ' + dbResult.error + ' (will try to continue anyway)')
    }

    log('[App] Step 2: Start server...')
    await startServer(dbResult.dbUrl)

    log('[App] Step 3: Create window...')
    createWindow()
    log('[App] ✓ App running')
  } catch (err) {
    log('[App] FAILED: ' + err.message)
    log('[App] Stack: ' + (err.stack || 'no stack'))

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
  try { dialog.showErrorBox('Fatal Error', err.message + '\n\nLog: ' + (logFile || '')) } catch (e) {}
})

process.on('unhandledRejection', (reason) => {
  log('[FATAL] unhandledRejection: ' + String(reason))
})

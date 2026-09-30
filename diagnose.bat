@echo off
chcp 65001 >nul
title Moto World 29 - Diagnostics
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Diagnostics Tool
echo ============================================
echo.

if not exist "diagnostics" mkdir "diagnostics"

set "BUILD_LOG=%~dp0diagnostics\build-log.txt"
set "RUNTIME_LOG=%~dp0diagnostics\runtime-log.txt"
set "REPORT_LOG=%~dp0diagnostics\diagnostic-report.txt"
set "ERRORS_LOG=%~dp0diagnostics\errors-only.txt"

if exist "%BUILD_LOG%" del "%BUILD_LOG%"
if exist "%RUNTIME_LOG%" del "%RUNTIME_LOG%"
if exist "%REPORT_LOG%" del "%REPORT_LOG%"
if exist "%ERRORS_LOG%" del "%ERRORS_LOG%"

echo [1/8] System info...
(
  echo ============================================
  echo   Moto World 29 - Diagnostic Report
  echo ============================================
  echo.
  echo Date: %DATE% %TIME%
  echo.
  echo --- OS ---
  ver
  echo.
  echo --- User ---
  echo %USERNAME%
  echo.
  echo --- Path ---
  echo %CD%
  echo.
  echo --- CPU ---
  wmic cpu get name /value 2>nul | findstr "="
  echo.
  echo --- RAM ---
  wmic OS get TotalVisibleMemorySize /value 2>nul | findstr "="
  echo.
) > "%REPORT_LOG%"

echo [2/8] Checking requirements...
(
  echo.
  echo --- Node.js ---
  where node 2>nul
  node --version 2>nul
  echo.
  echo --- npm ---
  where npm 2>nul
  call npm --version 2>nul
  echo.
  echo --- Git ---
  where git 2>nul
  git --version 2>nul
  echo.
) >> "%REPORT_LOG%"

echo [3/8] Checking project files...
(
  echo.
  echo --- Project Files ---
  if exist "package.json" ( echo OK: package.json ) else ( echo MISSING: package.json )
  if exist "next.config.ts" ( echo OK: next.config.ts ) else ( echo MISSING: next.config.ts )
  if exist ".env" ( echo OK: .env ) else ( echo MISSING: .env )
  if exist ".env.example" ( echo OK: .env.example ) else ( echo MISSING: .env.example )
  if exist "electron\main.js" ( echo OK: electron\main.js ) else ( echo MISSING: electron\main.js )
  if exist "electron\preload.js" ( echo OK: electron\preload.js ) else ( echo MISSING: electron\preload.js )
  if exist "prisma\schema.prisma" ( echo OK: prisma\schema.prisma ) else ( echo MISSING: prisma\schema.prisma )
  if exist "public\moto-world-logo.jpg" ( echo OK: logo ) else ( echo MISSING: logo )
  if exist "node_modules" ( echo OK: node_modules ) else ( echo MISSING: node_modules )
  if exist "node_modules\electron" ( echo OK: electron installed ) else ( echo MISSING: electron )
  if exist "node_modules\.prisma" ( echo OK: prisma client ) else ( echo MISSING: prisma client )
  echo.
) >> "%REPORT_LOG%"

echo [4/8] package.json content...
(
  echo.
  echo --- package.json ---
  type "package.json"
  echo.
) >> "%REPORT_LOG%"

echo [5/8] Building app (this takes time)...
echo     Please wait...
echo.

(
  echo ============================================
  echo   Build Log
  echo ============================================
  echo Start: %DATE% %TIME%
  echo.
) > "%BUILD_LOG%"

if not exist "node_modules" (
  echo     Installing dependencies...
  (
    echo --- npm install ---
    call npm install 2>&1
    echo.
  ) >> "%BUILD_LOG%"
)

if not exist ".env" (
  copy .env.example .env >nul
  (
    echo --- Created .env ---
    echo.
  ) >> "%BUILD_LOG%"
)

echo     Setting up database...
(
  echo --- prisma db push ---
  call npx prisma db push --accept-data-loss 2>&1
  echo.
) >> "%BUILD_LOG%"

echo     Building Next.js + Electron...
echo     This may take 3-8 minutes. DO NOT CLOSE.
echo.

(
  echo --- npm run electron:build ---
  echo Start: %DATE% %TIME%
  echo.
) >> "%BUILD_LOG%"

call npm run electron:build >> "%BUILD_LOG%" 2>&1
set BUILD_EXIT=%ERRORLEVEL%

(
  echo.
  echo End: %DATE% %TIME%
  echo Exit code: %BUILD_EXIT%
  echo.
) >> "%BUILD_LOG%"

echo     Build finished (exit code: %BUILD_EXIT%)
echo.

echo [6/8] Checking build results...
(
  echo.
  echo --- Build Results ---
  echo.
  if exist ".next\standalone\server.js" ( echo OK: standalone\server.js ) else ( echo MISSING: standalone\server.js )
  if exist ".next\standalone\public" ( echo OK: standalone\public ) else ( echo MISSING: standalone\public )
  if exist ".next\standalone\electron" ( echo OK: standalone\electron ) else ( echo MISSING: standalone\electron )
  if exist ".next\standalone\node_modules\.prisma" ( echo OK: standalone prisma ) else ( echo MISSING: standalone prisma )
  if exist ".next\standalone\node_modules\@prisma\engines" ( echo OK: standalone prisma engines ) else ( echo MISSING: standalone prisma engines )
  if exist "prisma\template.db" ( echo OK: template.db ) else ( echo MISSING: template.db )
  echo.
  echo --- dist folder ---
  if exist "dist" (
    dir /b "dist" 2>nul
    echo.
    echo --- exe files ---
    dir /b "dist\*.exe" 2>nul
  ) else (
    echo MISSING: dist folder
  )
  echo.
) >> "%REPORT_LOG%"

echo [7/8] Testing app launch...
(
  echo.
  echo ============================================
  echo   Runtime Log
  echo ============================================
  echo Start: %DATE% %TIME%
  echo.
) > "%RUNTIME_LOG%"

set "EXE_FILE="
for %%f in ("dist\Moto World 29*.exe") do set "EXE_FILE=%%f"

if "%EXE_FILE%"=="" (
  echo     No exe found - skipping launch test
  (
    echo No exe found - skipping launch test
    echo.
  ) >> "%RUNTIME_LOG%"
) else (
  echo     Found: %EXE_FILE%
  echo     Launching app for 15 seconds...
  (
    echo Found: %EXE_FILE%
    echo.
  ) >> "%RUNTIME_LOG%"

  start "" "%EXE_FILE%"
  timeout /t 15 /nobreak >nul

  (
    echo --- Processes after 15 seconds ---
    echo.
    echo Looking for Moto World 29...
    tasklist 2>nul | findstr /i "Moto"
    if errorlevel 1 (
      echo FAIL: App NOT running - crashed
    ) else (
      echo OK: App is running
    )
    echo.
    echo Looking for node.exe...
    tasklist 2>nul | findstr /i "node"
    echo.
    echo --- HTTP test localhost:3000 ---
    powershell -command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -TimeoutSec 5 -UseBasicParsing; Write-Host ('HTTP Status: ' + $r.StatusCode) } catch { Write-Host ('Error: ' + $_.Exception.Message) }" 2>&1
    echo.
    echo --- Listening ports ---
    netstat -ano 2>nul | findstr "LISTENING" | findstr "3000 3001 3002"
    echo.
  ) >> "%RUNTIME_LOG%"

  echo     Stopping app...
  taskkill /f /im "Moto World 29.exe" 2>nul
  taskkill /f /im node.exe 2>nul

  (
    echo App stopped.
    echo End: %DATE% %TIME%
    echo.
  ) >> "%RUNTIME_LOG%"
)

echo [8/8] Collecting AppData logs...
(
  echo.
  echo --- AppData Logs ---
  echo.
) >> "%REPORT_LOG%"

set "APPDATA_LOGS=%APPDATA%\Moto World 29\logs"

if exist "%APPDATA_LOGS%" (
  echo     Found logs in AppData
  (
    echo Found logs in: %APPDATA_LOGS%
    echo.
    dir "%APPDATA_LOGS%" 2>nul
    echo.
  ) >> "%REPORT_LOG%"
  for /f "delims=" %%f in ('dir /b /o-d "%APPDATA_LOGS%\*.log" 2^>nul') do (
    (
      echo --- %%f ---
      type "%APPDATA_LOGS%\%%f"
      echo.
    ) >> "%REPORT_LOG%"
    goto :done
  )
  :done
) else (
  echo     No AppData logs
  (
    echo No AppData logs found.
    echo Expected: %APPDATA_LOGS%
    echo.
  ) >> "%REPORT_LOG%"
)

echo.
echo Extracting errors...

(
  echo ============================================
  echo   Errors Only
  echo ============================================
  echo.
  echo === From build-log.txt ===
  echo.
  findstr /i /c:"error" /c:"fail" /c:"missing" "%BUILD_LOG%" 2>nul
  echo.
  echo === From runtime-log.txt ===
  echo.
  findstr /i /c:"error" /c:"fail" /c:"missing" /c:"warn" "%RUNTIME_LOG%" 2>nul
  echo.
  echo === From diagnostic-report.txt ===
  echo.
  findstr /i /c:"error" /c:"fail" /c:"missing" "%REPORT_LOG%" 2>nul
  echo.
  echo === Build exit code: %BUILD_EXIT% ===
  echo.
) > "%ERRORS_LOG%"

(
  echo.
  echo ============================================
  echo   Summary
  echo ============================================
  echo.
  if %BUILD_EXIT% equ 0 (
    echo Build: SUCCESS
  ) else (
    echo Build: FAILED (exit code %BUILD_EXIT%)
  )
  echo.
  if "%EXE_FILE%"=="" (
    echo exe: NOT created
  ) else (
    echo exe: %EXE_FILE%
  )
  echo.
  echo Files created in diagnostics\:
  echo   1. diagnostic-report.txt
  echo   2. build-log.txt
  echo   3. runtime-log.txt
  echo   4. errors-only.txt
  echo.
) >> "%REPORT_LOG%"

echo.
echo ============================================
echo   DONE!
echo ============================================
echo.
echo Files in: %~dp0diagnostics\
echo.
echo   1. diagnostic-report.txt  (full report)
echo   2. build-log.txt          (build output)
echo   3. runtime-log.txt        (runtime test)
echo   4. errors-only.txt        (errors only)
echo.
echo Opening folder...
explorer "%~dp0diagnostics"
echo.
pause

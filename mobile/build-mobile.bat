@echo off
title Moto World 29 Mobile - Setup
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Mobile Setup
echo ============================================
echo.

REM Step 1: Check Node version (must be v20, not v24)
echo [1] Checking Node.js...
for /f "tokens=*" %%v in ('node --version 2^>nul') do set NODE_VER=%%v
if "%NODE_VER%"=="" (
    echo FAIL: Node.js not installed
    echo Download v20 LTS from: https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi
    pause
    exit /b 1
)
echo Node version: %NODE_VER%

REM Check if v24 (bad)
echo %NODE_VER% | findstr /r "^v24" >nul
if not errorlevel 1 (
    echo.
    echo ============================================
    echo   FAIL: Node.js v24 detected
    echo ============================================
    echo.
    echo Node v24 is too new and breaks Expo.
    echo You MUST install Node v20 LTS:
    echo.
    echo 1. Control Panel - Uninstall Node.js
    echo 2. Download: https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi
    echo 3. Install it
    echo 4. Restart this script
    echo.
    pause
    exit /b 1
)

echo OK: Node version is compatible
echo.

REM Step 2: Check npm
echo [2] Checking npm...
call npm --version >nul 2>&1
if errorlevel 1 (
    echo FAIL: npm not found
    pause
    exit /b 1
)
echo OK
echo.

REM Step 3: Clean old files
echo [3] Cleaning old files...
if exist "node_modules" rmdir /s /q node_modules
if exist ".expo" rmdir /s /q .expo
if exist "package-lock.json" del package-lock.json
echo OK
echo.

REM Step 4: Install dependencies
echo [4] Installing dependencies (2-5 min)...
call npm install
if errorlevel 1 (
    echo.
    echo FAIL: npm install failed
    pause
    exit /b 1
)
echo OK
echo.

REM Step 5: Fix any version conflicts
echo [5] Fixing version conflicts...
call npx expo install --fix
echo OK
echo.

REM Step 6: Verify Expo CLI
echo [6] Verifying Expo...
call npx expo --version
echo.

REM Step 7: Instructions
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Next steps:
echo.
echo 1. Install "Expo Go" on your Android phone
echo    (from Google Play Store)
echo.
echo 2. Run: npx expo start
echo.
echo 3. Scan the QR code with your phone camera
echo.
echo 4. App will open in Expo Go!
echo.
echo ============================================

echo.
echo Do you want to start Expo now? (Y/N)
set /p choice=""
if /i "%choice%"=="Y" (
    echo.
    echo Starting Expo...
    echo Press Ctrl+C to stop.
    echo.
    call npx expo start
)
pause

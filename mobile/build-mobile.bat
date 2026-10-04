@echo off
title Moto World 29 Mobile - Build APK
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Build Android APK
echo ============================================
echo.

REM Step 1: Check Node version (must be v20, not v24)
echo [1/8] Checking Node.js...
for /f "tokens=*" %%v in ('node --version 2^>nul') do set NODE_VER=%%v
if "%NODE_VER%"=="" (
    echo FAIL: Node.js not installed
    echo Download v20 LTS from: https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi
    pause
    exit /b 1
)
echo Node: %NODE_VER%
echo %NODE_VER% | findstr /r "^v24" >nul
if not errorlevel 1 (
    echo.
    echo FAIL: Node v24 detected. Install Node v20 LTS.
    echo Download: https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi
    pause
    exit /b 1
)
echo OK
echo.

REM Step 2: Ensure npm global folder exists
echo [2/8] Ensuring npm folder exists...
if not exist "%APPDATA%\npm" mkdir "%APPDATA%\npm"
echo OK
echo.

REM Step 3: Clean old files
echo [3/8] Cleaning old files...
if exist "node_modules" rmdir /s /q node_modules
if exist ".expo" rmdir /s /q .expo
if exist "package-lock.json" del package-lock.json
echo OK
echo.

REM Step 4: Install dependencies
echo [4/8] Installing dependencies (3-5 min)...
call npm install
if errorlevel 1 (
    echo FAIL: npm install failed
    pause
    exit /b 1
)
echo OK
echo.

REM Step 5: Fix version conflicts
echo [5/8] Fixing versions...
call npx expo install --fix
echo OK
echo.

REM Step 6: Verify files exist
echo [6/8] Verifying project files...
if not exist "App.tsx" echo FAIL: App.tsx missing & pause & exit /b 1
if not exist "app.json" echo FAIL: app.json missing & pause & exit /b 1
if not exist "package.json" echo FAIL: package.json missing & pause & exit /b 1
if not exist "eas.json" echo FAIL: eas.json missing & pause & exit /b 1
if not exist "assets\icon.png" echo FAIL: assets\icon.png missing & pause & exit /b 1
if not exist "src\db\database.ts" echo FAIL: database.ts missing & pause & exit /b 1
if not exist "src\components\ui.tsx" echo FAIL: ui.tsx missing & pause & exit /b 1
echo OK - all files present
echo.

REM Step 7: Choose what to do
:menu
echo ============================================
echo   Choose an option:
echo ============================================
echo.
echo   1. Test on phone with Expo Go (needs internet)
echo   2. Build standalone APK (EAS Build - 10-20 min cloud)
echo   3. Exit
echo.
set /p choice="Enter 1, 2, or 3: "

if "%choice%"=="1" goto test_expo
if "%choice%"=="2" goto build_apk
if "%choice%"=="3" exit /b 0
echo Invalid choice.
goto menu

:test_expo
echo.
echo ============================================
echo   Starting Expo with tunnel...
echo ============================================
echo.
echo 1. Install "Expo Go" on your Android phone (Google Play)
echo 2. Scan the QR code with phone camera
echo 3. App opens in Expo Go
echo.
echo Press Ctrl+C to stop.
echo.
call npx expo start --tunnel
pause
exit /b 0

:build_apk
echo.
echo ============================================
echo   Building APK with EAS
echo ============================================
echo.
echo This requires a free Expo account.
echo If you do not have one, the script will help you create one.
echo.

echo Step 1: Login to Expo (creates account if needed)
call npx eas-cli login
echo.

echo Step 2: Initialize EAS project
call npx eas-cli init --id moto-world-29
echo.

echo Step 3: Building APK (10-20 min in cloud)...
echo DO NOT close this window.
echo.
call npx eas-cli build -p android --profile preview
if errorlevel 1 (
    echo.
    echo ============================================
    echo   Build failed
    echo ============================================
    echo Common fixes:
    echo - Make sure you are logged in (eas login)
    echo - Make sure app.json has valid config
    echo - Check the error above
    echo.
    pause
    exit /b 1
)
echo.
echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo The APK download link should appear above.
echo Check your Expo dashboard:
echo https://expo.dev
echo.
echo Download the APK, transfer to phone, install.
echo.
pause
exit /b 0

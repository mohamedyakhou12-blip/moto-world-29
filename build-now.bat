@echo off
title Moto World 29 - Build
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Build
echo ============================================
echo.

REM Check Node.js
echo [1] Checking Node.js...
node --version
if errorlevel 1 (
    echo FAIL: Node.js not installed
    pause
    exit /b 1
)
echo OK
echo.

REM Check npm
echo [2] Checking npm...
call npm --version
if errorlevel 1 (
    echo FAIL: npm not found
    pause
    exit /b 1
)
echo OK
echo.

REM Install deps
echo [3] Installing dependencies...
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo FAIL: npm install failed
        pause
        exit /b 1
    )
) else (
    echo OK: node_modules exists
)
echo.

REM Create .env
echo [4] Setting up .env...
if not exist ".env" copy .env.example .env
echo OK
echo.

REM Database
echo [5] Database setup...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo FAIL: prisma db push failed
    pause
    exit /b 1
)
echo OK
echo.

REM Clean + Build
echo [6] Building (3-8 min)...
if exist "dist" rmdir /s /q dist
if exist ".next\standalone" rmdir /s /q ".next\standalone"

call npm run electron:build
set BUILD_EXIT=%ERRORLEVEL%
echo.
echo Build exit code: %BUILD_EXIT%
echo.

if %BUILD_EXIT% neq 0 (
    echo ============================================
    echo   BUILD FAILED
    echo ============================================
    pause
    exit /b 1
)

REM Verify
echo [7] Verifying...
echo.

if exist "dist\win-unpacked\Moto World 29.exe" (
    echo OK: Moto World 29.exe found
) else (
    echo FAIL: exe not found
    pause
    exit /b 1
)

if exist ".next\standalone\server.js" (
    echo OK: server.js found
) else (
    echo FAIL: server.js not found
)

if exist ".next\standalone\node_modules\prisma\build\index.js" (
    echo OK: prisma CLI found
) else (
    echo FAIL: prisma CLI not found
)

if exist ".next\standalone\prisma\schema.prisma" (
    echo OK: schema.prisma found
) else (
    echo FAIL: schema.prisma not found
)

if exist "prisma\template.db" (
    echo OK: template.db found
) else (
    echo FAIL: template.db not found
)

echo.
echo ============================================
echo   BUILD SUCCESS
echo ============================================
echo.
echo Next: run test-app.bat to test the app
echo.
pause

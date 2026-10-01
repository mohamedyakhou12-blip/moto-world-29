@echo off
title Moto World 29 - Dev
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Run (Dev Mode)
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo FAIL: Node.js not installed
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

if not exist ".env" copy .env.example .env >nul

if not exist "db\custom.db" (
    echo Setting up database...
    call npx prisma db push --accept-data-loss
)

echo.
echo ============================================
echo App: http://localhost:3000
echo.
echo Press Ctrl+C to stop.
echo ============================================
echo.

timeout /t 5 /nobreak >nul
start http://localhost:3000

call npm run dev

pause

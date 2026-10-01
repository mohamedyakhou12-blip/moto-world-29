@echo off
title Moto World 29 - Build
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Build .exe
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
    if errorlevel 1 (
        echo FAIL: npm install failed
        pause
        exit /b 1
    )
)

if not exist ".env" copy .env.example .env >nul

echo Setting up database...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo FAIL: database setup failed
    pause
    exit /b 1
)

echo Building .exe (3-8 min)...
echo DO NOT close this window.
echo.
call npm run electron:build
if errorlevel 1 (
    echo.
    echo FAIL: build failed
    pause
    exit /b 1
)

echo.
echo ============================================
if exist "dist\win-unpacked\Moto World 29.exe" (
    echo   BUILD SUCCESS
    echo.
    echo   exe: dist\win-unpacked\Moto World 29.exe
    echo.
    echo   Run test-app.bat to test
) else (
    echo   BUILD DONE - check dist folder
)
echo ============================================
echo.
pause

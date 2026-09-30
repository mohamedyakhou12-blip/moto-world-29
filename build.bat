@echo off
chcp 65001 >nul
title Moto World 29 - Build
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Build .exe
echo ============================================
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo FAIL: Node.js is not installed
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)
echo OK: Node.js found
echo.

REM Install deps if needed
if not exist "node_modules" (
    echo Installing dependencies (5-10 minutes)...
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

REM Setup .env
if not exist ".env" (
    copy .env.example .env >nul
    echo Created .env
)
echo.

REM Database
echo Setting up database...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo FAIL: database setup failed
    pause
    exit /b 1
)
echo.

REM Build
echo Building .exe (3-8 minutes)...
echo DO NOT close this window.
echo.
call npm run electron:build
if errorlevel 1 (
    echo.
    echo FAIL: build failed
    echo.
    pause
    exit /b 1
)
echo.

REM Check result
if exist "dist\Moto World 29 1.0.0.exe" (
    echo.
    echo ============================================
    echo   SUCCESS!
    echo ============================================
    echo.
    echo exe file: %~dp0dist\Moto World 29 1.0.0.exe
    echo.
    echo Open dist folder?
    choice /c yn /m "(Y/N)"
    if errorlevel 2 goto end
    if errorlevel 1 explorer "dist"
) else (
    echo.
    echo WARNING: build done but exe not found
    echo Check dist\ folder
)
:end
echo.
pause

@echo off
chcp 65001 >nul
title Moto World 29 - Build
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Build (clean + verify)
echo ============================================
echo.

REM Step 1: Check Node.js
echo [1/7] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo FAIL: Node.js not installed
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo OK: Node.js %NODE_VER%
echo.

REM Step 2: Check npm
echo [2/7] Checking npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo FAIL: npm not found
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('call npm --version') do set NPM_VER=%%v
echo OK: npm %NPM_VER%
echo.

REM Step 3: Install dependencies (or verify)
echo [3/7] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies (5-10 min)...
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

REM Step 4: Create .env
echo [4/7] Setting up .env...
if not exist ".env" (
    copy .env.example .env >nul
    echo Created .env
) else (
    echo OK: .env exists
)
echo.

REM Step 5: Database setup
echo [5/7] Database setup...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo FAIL: prisma db push failed
    pause
    exit /b 1
)
echo.

REM Step 6: Clean old dist + build
echo [6/7] Building (3-8 min)...
echo Cleaning old dist...
if exist "dist" rmdir /s /q dist
if exist ".next\standalone" rmdir /s /q ".next\standalone"
echo.
echo Running: npm run electron:build
echo DO NOT close this window.
echo.
call npm run electron:build
set BUILD_EXIT=%ERRORLEVEL%
echo.
echo Build exit code: %BUILD_EXIT%
if %BUILD_EXIT% neq 0 (
    echo FAIL: build failed
    pause
    exit /b 1
)
echo.

REM Step 7: Verify build output
echo [7/7] Verifying build output...
echo.

echo --- dist folder ---
if exist "dist\win-unpacked" (
    echo OK: dist\win-unpacked exists
    dir /b "dist\win-unpacked" 2>nul
) else (
    echo FAIL: dist\win-unpacked not found
)
echo.

echo --- exe file ---
set "EXE_FILE="
for %%f in ("dist\win-unpacked\Moto World 29.exe") do set "EXE_FILE=%%f"
if "%EXE_FILE%"=="" (
    echo FAIL: Moto World 29.exe not found
) else (
    echo OK: %EXE_FILE%
    for %%A in ("%EXE_FILE%") do echo Size: %%~zA bytes
)
echo.

echo --- standalone server.js ---
if exist ".next\standalone\server.js" (
    echo OK: server.js exists
) else (
    echo FAIL: server.js not found
)
echo.

echo --- standalone prisma ---
if exist ".next\standalone\node_modules\prisma\build\index.js" (
    echo OK: prisma CLI exists
) else (
    echo FAIL: prisma CLI not found
)
echo.

echo --- standalone schema ---
if exist ".next\standalone\prisma\schema.prisma" (
    echo OK: schema.prisma exists
) else (
    echo FAIL: schema.prisma not found
)
echo.

echo --- template.db ---
if exist "prisma\template.db" (
    echo OK: template.db exists
    for %%A in ("prisma\template.db") do echo Size: %%~zA bytes
) else (
    echo FAIL: template.db not found
)
echo.

echo ============================================
if "%EXE_FILE%"=="" (
    echo   BUILD FAILED - exe not created
    echo   Check errors above
) else (
    echo   BUILD SUCCESS
    echo.
    echo   exe: %EXE_FILE%
    echo.
    echo   Next: run test-app.bat to test
)
echo ============================================
echo.
echo Press any key to open dist folder...
pause >nul
if exist "dist\win-unpacked" explorer "dist\win-unpacked"

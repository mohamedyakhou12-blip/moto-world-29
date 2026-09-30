@echo off
title Moto World 29 - Debug
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Debug (step by step)
echo ============================================
echo.
echo This will run each step and pause.
echo Press any key after each step to continue.
echo.
pause

echo.
echo === STEP 1: Create diagnostics folder ===
if not exist "diagnostics" mkdir "diagnostics"
echo Done.
pause

echo.
echo === STEP 2: Check Node.js ===
node --version
if errorlevel 1 (echo FAIL: Node.js not found) else (echo OK)
pause

echo.
echo === STEP 3: Check npm ===
npm --version
if errorlevel 1 (echo FAIL: npm not found) else (echo OK)
pause

echo.
echo === STEP 4: Check package.json ===
if exist "package.json" (echo OK: package.json found) else (echo FAIL: package.json missing)
pause

echo.
echo === STEP 5: Check node_modules ===
if exist "node_modules" (echo OK: node_modules exists) else (echo MISSING: need npm install)
pause

echo.
echo === STEP 6: Check .env ===
if exist ".env" (echo OK: .env exists) else (echo MISSING: will create)
pause

echo.
echo === STEP 7: Install deps (if needed) ===
if not exist "node_modules" (
    echo Running npm install... (5-10 min)
    call npm install
    echo npm install exit code: %errorlevel%
) else (
    echo Skipping - node_modules exists
)
pause

echo.
echo === STEP 8: Create .env (if needed) ===
if not exist ".env" (
    copy .env.example .env
    echo Created .env
) else (
    echo .env already exists
)
pause

echo.
echo === STEP 9: Database setup ===
echo Running prisma db push...
call npx prisma db push --accept-data-loss
echo prisma exit code: %errorlevel%
pause

echo.
echo === STEP 10: BUILD (3-8 min) ===
echo This is the long step. Please wait.
echo Output goes to diagnostics\build-log.txt
echo.
call npm run electron:build > "diagnostics\build-log.txt" 2>&1
echo.
echo BUILD exit code: %errorlevel%
pause

echo.
echo === STEP 11: Check results ===
if exist ".next\standalone\server.js" (echo OK: standalone server.js) else (echo MISSING: server.js)
if exist "prisma\template.db" (echo OK: template.db) else (echo MISSING: template.db)
if exist "dist" (
    echo dist folder contents:
    dir /b "dist"
) else (
    echo MISSING: dist folder
)
pause

echo.
echo === STEP 12: Test launch (if exe exists) ===
set "EXE_FILE="
for %%f in ("dist\Moto World 29*.exe") do set "EXE_FILE=%%f"

if "%EXE_FILE%"=="" (
    echo No exe found - skip launch test
) else (
    echo Found: %EXE_FILE%
    echo Launching for 15 seconds...
    start "" "%EXE_FILE%"
    timeout /t 15 /nobreak >nul
    
    echo.
    echo Checking if app is running:
    tasklist | findstr /i "Moto"
    if errorlevel 1 (echo App NOT running - crashed) else (echo App is running)
    
    echo.
    echo Checking node.exe:
    tasklist | findstr /i "node"
    
    echo.
    echo Checking port 3000:
    netstat -ano | findstr "LISTENING" | findstr "3000"
    
    echo.
    echo Stopping app...
    taskkill /f /im "Moto World 29.exe" 2>nul
    taskkill /f /im node.exe 2>nul
)
pause

echo.
echo === STEP 13: AppData logs ===
set "LOGDIR=%APPDATA%\Moto World 29\logs"
if exist "%LOGDIR%" (
    echo Found logs:
    dir "%LOGDIR%"
    echo.
    echo Copying latest log...
    for /f "delims=" %%f in ('dir /b /o-d "%LOGDIR%\*.log" 2^>nul') do (
        type "%LOGDIR%\%%f"
        echo. > "diagnostics\appdata-log.txt"
        type "%LOGDIR%\%%f" >> "diagnostics\appdata-log.txt"
        goto :logdone
    )
    :logdone
) else (
    echo No AppData logs - app never started
)
pause

echo.
echo ============================================
echo   DONE!
echo ============================================
echo.
echo Files created in diagnostics\:
dir /b diagnostics
echo.
echo Send diagnostics\build-log.txt to your assistant.
echo.
pause

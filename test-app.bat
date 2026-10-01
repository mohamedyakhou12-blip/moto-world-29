@echo off
chcp 65001 >nul
title Moto World 29 - Test App
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Test Unpacked App
echo ============================================
echo.

REM Step 1: Kill any running instance
echo [1] Stopping any running instance...
taskkill /f /im "Moto World 29.exe" 2>nul
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
echo OK
echo.

REM Step 2: Clean old AppData
echo [2] Cleaning old AppData...
set "APPDATA_DIR=%APPDATA%\Moto World 29"
if exist "%APPDATA_DIR%" (
    rmdir /s /q "%APPDATA_DIR%"
    echo Old data removed
) else (
    echo No old data found
)
echo.

REM Step 3: Check if exe exists
echo [3] Checking for exe...
set "EXE_FILE="
for %%f in ("dist\win-unpacked\Moto World 29.exe") do set "EXE_FILE=%%f"
if "%EXE_FILE%"=="" (
    echo FAIL: dist\win-unpacked\Moto World 29.exe not found
    echo Run: npm run electron:build
    pause
    exit /b 1
)
echo Found: %EXE_FILE%
echo.

REM Step 4: Launch app
echo [4] Launching app...
echo Waiting 25 seconds for database creation + server start...
echo.
start "" "%EXE_FILE%"

REM Wait for app to start (25 seconds for first run with DB creation)
timeout /t 25 /nobreak >nul

REM Step 5: Check if app is running
echo [5] Checking if app is running...
tasklist 2>nul | findstr /i "Moto World"
if errorlevel 1 (
    echo FAIL: App is NOT running - it crashed
    goto :showlog
) else (
    echo OK: App is running
)
echo.

REM Step 6: Check if server is responding
echo [6] Testing server (port 3000)...
powershell -command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -TimeoutSec 10 -UseBasicParsing; Write-Host ('HTTP ' + $r.StatusCode + ' OK') } catch { Write-Host ('FAIL: ' + $_.Exception.Message) }"
echo.

REM Step 7: Test API endpoints
echo [7] Testing API endpoints...
echo.

echo   GET /api/settings:
powershell -command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/settings' -TimeoutSec 10 -UseBasicParsing; Write-Host ('  HTTP ' + $r.StatusCode); Write-Host ('  Body: ' + $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length))) } catch { Write-Host ('  FAIL: ' + $_.Exception.Message) }"
echo.

echo   GET /api/products:
powershell -command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/products' -TimeoutSec 10 -UseBasicParsing; Write-Host ('  HTTP ' + $r.StatusCode); Write-Host ('  Body: ' + $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length))) } catch { Write-Host ('  FAIL: ' + $_.Exception.Message) }"
echo.

echo   GET /api/receipts:
powershell -command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/receipts' -TimeoutSec 10 -UseBasicParsing; Write-Host ('  HTTP ' + $r.StatusCode); Write-Host ('  Body: ' + $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length))) } catch { Write-Host ('  FAIL: ' + $_.Exception.Message) }"
echo.

echo   GET /api/reports?type=dashboard:
powershell -command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/api/reports?type=dashboard&tz=0' -TimeoutSec 10 -UseBasicParsing; Write-Host ('  HTTP ' + $r.StatusCode); Write-Host ('  Body: ' + $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length))) } catch { Write-Host ('  FAIL: ' + $_.Exception.Message) }"
echo.

REM Step 8: Check database file
echo [8] Checking database file...
set "DB_FILE=%APPDATA%\Moto World 29\custom.db"
if exist "%DB_FILE%" (
    for %%A in ("%DB_FILE%") do echo OK: custom.db exists, size: %%~zA bytes
) else (
    echo FAIL: custom.db does NOT exist!
)
echo.

REM Step 9: Check listening ports
echo [9] Listening ports:
netstat -ano 2>nul | findstr "LISTENING" | findstr "3000 3001 3002"
echo.

:showlog
REM Step 10: Show log
echo [10] App log:
echo.
set "LOG_DIR=%APPDATA%\Moto World 29\logs"
if exist "%LOG_DIR%" (
    echo Log files:
    dir /b "%LOG_DIR%" 2>nul
    echo.
    echo --- Log content (last 50 lines) ---
    for /f "delims=" %%f in ('dir /b /o-d "%LOG_DIR%\*.log" 2^>nul') do (
        powershell -command "Get-Content '%LOG_DIR%\%%f' -Tail 50"
        goto :logdone
    )
    :logdone
) else (
    echo No log directory found at: %LOG_DIR%
    echo This means the app crashed before logging started.
    echo.
    echo Check temp log:
    set "TEMP_LOG=%TEMP%\moto-world-29-logs"
    if exist "%TEMP_LOG%" (
        dir /b "%TEMP_LOG%"
        for /f "delims=" %%f in ('dir /b /o-d "%TEMP_LOG%\*.log" 2^>nul') do (
            powershell -command "Get-Content '%TEMP_LOG%\%%f' -Tail 50"
            goto :templogdone
        )
    )
    :templogdone
)
echo.

REM Stop the app
echo [11] Stopping app...
taskkill /f /im "Moto World 29.exe" 2>nul
taskkill /f /im node.exe 2>nul
echo.

echo ============================================
echo   Test Complete
echo ============================================
echo.
echo If APIs returned HTTP 200 with JSON data, the app works.
echo If APIs returned FAIL or 500 errors, send this output to your assistant.
echo.
pause

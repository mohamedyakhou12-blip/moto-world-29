@echo off
title Moto World 29 - Test
cd /d "%~dp0"

echo.
echo ============================================
echo   Moto World 29 - Test App
echo ============================================
echo.

REM Kill old instances
echo [1] Stopping old instances...
taskkill /f /im "Moto World 29.exe" 2>nul
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
echo OK
echo.

REM Clean AppData
echo [2] Cleaning old data...
if exist "%APPDATA%\Moto World 29" rmdir /s /q "%APPDATA%\Moto World 29"
echo OK
echo.

REM Check exe
echo [3] Checking for exe...
if not exist "dist\win-unpacked\Moto World 29.exe" (
    echo FAIL: exe not found. Run build-now.bat first.
    pause
    exit /b 1
)
echo OK: exe found
echo.

REM Launch
echo [4] Launching app...
echo Waiting 25 seconds for database creation + server start...
echo DO NOT close this window.
echo.
start "" "dist\win-unpacked\Moto World 29.exe"
timeout /t 25 /nobreak >nul
echo.

REM Check process
echo [5] Checking if app is running...
tasklist 2>nul | findstr /i "Moto World"
if errorlevel 1 (
    echo FAIL: App NOT running - it crashed
    goto :showlog
)
echo OK: App is running
echo.

REM Check database
echo [6] Checking database...
if exist "%APPDATA%\Moto World 29\custom.db" (
    for %%A in ("%APPDATA%\Moto World 29\custom.db") do echo OK: custom.db size: %%~zA bytes
) else (
    echo FAIL: custom.db not created
)
echo.

REM Test APIs with curl (built into Windows 10+)
echo [7] Testing APIs...
echo.

echo   GET /api/settings:
curl -s -o nul -w "  HTTP %%{http_code}\n" http://127.0.0.1:3000/api/settings 2>nul
echo.

echo   GET /api/products:
curl -s -w "\n  HTTP %%{http_code}\n" http://127.0.0.1:3000/api/products 2>nul
echo.

echo   GET /api/receipts:
curl -s -o nul -w "  HTTP %%{http_code}\n" http://127.0.0.1:3000/api/receipts 2>nul
echo.

echo   GET /api/reports:
curl -s -o nul -w "  HTTP %%{http_code}\n" "http://127.0.0.1:3000/api/reports?type=dashboard&tz=0" 2>nul
echo.

REM Check ports
echo [8] Listening ports:
netstat -ano 2>nul | findstr "LISTENING" | findstr "3000 3001 3002"
echo.

:showlog
echo [9] App log (last 30 lines):
echo.
if exist "%APPDATA%\Moto World 29\logs" (
    for /f "delims=" %%f in ('dir /b /o-d "%APPDATA%\Moto World 29\logs\*.log" 2^>nul') do (
        type "%APPDATA%\Moto World 29\logs\%%f" 2>nul | more +0
        goto :done
    )
) else (
    echo No log in AppData. Checking temp...
    if exist "%TEMP%\moto-world-29-logs" (
        for /f "delims=" %%f in ('dir /b /o-d "%TEMP%\moto-world-29-logs\*.log" 2^>nul') do (
            type "%TEMP%\moto-world-29-logs\%%f" 2>nul
            goto :done
        )
    ) else (
        echo No logs found anywhere.
    )
)
:done
echo.

REM Stop
echo [10] Stopping app...
taskkill /f /im "Moto World 29.exe" 2>nul
taskkill /f /im node.exe 2>nul
echo.

echo ============================================
echo   Test Complete
echo ============================================
echo.
echo If APIs returned HTTP 200, the app works.
echo If APIs returned HTTP 500 or failed, copy
echo everything above and send to your assistant.
echo.
pause

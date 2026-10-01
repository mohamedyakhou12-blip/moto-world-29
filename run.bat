@echo off

chcp 65001 >nul

title Moto World 29 - Dev Server

cd /d "%~dp0"



echo.

echo ============================================

echo   Moto World 29 - Run (Dev Mode)

echo ============================================

echo.



where node >nul 2>&1

if errorlevel 1 (

    echo FAIL: Node.js is not installed

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

echo App running at: http://localhost:3000

echo Browser will open in 5 seconds...

echo.

echo Press Ctrl+C to stop.

echo ============================================

echo.



start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"



call npm run dev



pause


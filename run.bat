@echo off
REM ============================================================
REM  موتو ورلد 29 - تشغيل التطبيق (وضع التطوير)
REM  Moto World 29 - Run App (Development Mode)
REM ============================================================
REM
REM  يشغل التطبيق في المتصفح على http://localhost:3000
REM  Runs the app in browser at http://localhost:3000
REM
REM  لإيقاف التطبيق: اضغط Ctrl + C
REM
REM ============================================================

title موتو ورلد 29 - يعمل الآن (وضع التطوير)
color 0C

cd /d "%~dp0"

echo.
echo  ============================================================
echo            موتو ورلد 29 - تشغيل التطبيق
echo            Moto World 29 - Run Application
echo  ============================================================
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo  ❌ خطأ: Node.js غير مثبت
    echo  Error: Node.js is not installed
    echo  حمّله من: https://nodejs.org
    pause
    exit /b 1
)

REM Install deps if needed
if not exist "node_modules" (
    echo  تثبيت الاعتماديات...
    call npm install
    echo.
)

REM Setup DB if needed
if not exist ".env" copy .env.example .env >nul
if not exist "db\custom.db" (
    echo  إعداد قاعدة البيانات...
    call npx prisma db push --accept-data-loss
    echo.
)

echo  ============================================================
echo  التطبيق يعمل الآن على: http://localhost:3000
echo  سيتم فتح المتصفح تلقائياً...
echo.
echo  لإيقاف التطبيق: اضغط Ctrl + C
echo  ============================================================
echo.

REM Open browser after 5 seconds (in background)
start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

REM Start dev server
call npm run dev

pause

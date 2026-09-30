@echo off
REM ============================================================
REM  موتو ورلد 29 - بناء ملف .exe
REM  Moto World 29 - Build .exe file
REM ============================================================
REM
REM  الاستخدام: انقر مرتين على هذا الملف
REM  Usage: Double-click this file
REM
REM  سيقوم بـ:
REM  1. تثبيت الاعتماديات (إذا لزم)
REM  2. إعداد قاعدة البيانات
REM  3. بناء التطبيق
REM  4. إنشاء ملف .exe في مجلد dist\
REM
REM ============================================================

title موتو ورلد 29 - بناء التطبيق
color 0C

cd /d "%~dp0"

echo.
echo  ============================================================
echo                موتو ورلد 29 - بناء التطبيق
echo                Moto World 29 - Build Application
echo  ============================================================
echo.

REM ============================================================
REM 1. تحقق من Node.js
REM ============================================================
echo  [1/5] التحقق من Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ❌ خطأ: Node.js غير مثبت
    echo  Error: Node.js is not installed
    echo.
    echo  حمّله من: https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo    ✓ Node.js موجود
echo.

REM ============================================================
REM 2. تثبيت الاعتماديات (إذا لزم)
REM ============================================================
if not exist "node_modules" (
    echo  [2/5] تثبيت الاعتماديات...
    echo       قد يستغرق 5-10 دقائق...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  ❌ فشل تثبيت الاعتماديات
        echo.
        pause
        exit /b 1
    )
    echo.
) else (
    echo  [2/5] الاعتماديات مثبتة مسبقاً ✓
    echo.
)

REM ============================================================
REM 3. إعداد قاعدة البيانات
REM ============================================================
echo  [3/5] إعداد قاعدة البيانات...
if not exist ".env" (
    copy .env.example .env >nul
)
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo.
    echo  ❌ فشل إعداد قاعدة البيانات
    echo.
    pause
    exit /b 1
)
echo.

REM ============================================================
REM 4. بناء التطبيق + ملف .exe
REM ============================================================
echo  [4/5] بناء التطبيق...
echo       قد يستغرق 3-8 دقائق...
echo.
call npm run electron:build
if errorlevel 1 (
    echo.
    echo  ❌ فشل البناء
    echo.
    echo  تأكد من تثبيت Visual Studio C++ Build Tools
    echo  Read: BUILD-WINDOWS.md
    echo.
    pause
    exit /b 1
)
echo.

REM ============================================================
REM 5. النتيجة
REM ============================================================
echo  [5/5] التحقق من النتيجة...
if exist "dist\Moto World 29 1.0.0.exe" (
    echo.
    echo  ============================================================
    echo  ✅  تم بناء التطبيق بنجاح!
    echo  ============================================================
    echo.
    echo  📁 ملف .exe موجود في:
    echo.
    echo     %~dp0dist\Moto World 29 1.0.0.exe
    echo.
    echo  🎉 انسخه إلى سطح المكتب وانقر مرتين لتشغيله!
    echo.
    echo  هل تريد فتح مجلد dist الآن؟
    choice /c yn /m "(Y/N)"
    if errorlevel 2 goto end
    if errorlevel 1 explorer "dist"
) else (
    echo.
    echo  ⚠  البناء اكتمل لكن لم يتم العثور على ملف .exe
    echo     تحقق من مجلد dist\
)
:end
echo.
pause

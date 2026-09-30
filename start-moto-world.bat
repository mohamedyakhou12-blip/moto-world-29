@echo off
REM ============================================================
REM  موتو ورلد 29 - تشغيل التطبيق في وضع الإنتاج
REM  Moto World 29 - Start Production Server
REM ============================================================
REM
REM  الاستخدام: انقر مرتين على هذا الملف لتشغيل التطبيق
REM  Usage: Double-click this file to start the app
REM
REM  ثم افتح المتصفح على: http://localhost:3000
REM  Then open browser at: http://localhost:3000
REM
REM  لإيقاف التطبيق: استخدم stop-moto-world.bat
REM  To stop: use stop-moto-world.bat
REM
REM ============================================================

title موتو ورلد 29 - يعمل الآن
color 0C

echo.
echo  ============================================================
echo                موتو ورلد 29 - إدارة المتجر
echo                Moto World 29 - Store Manager
echo  ============================================================
echo.
echo  جارٍ تشغيل التطبيق... الرجاء الانتظار
echo  Starting the application... Please wait
echo.
echo  ------------------------------------------------------------
echo  بعد التشغيل، افتح المتصفح على:
echo  After start, open your browser at:
echo.
echo                     http://localhost:3000
echo  ------------------------------------------------------------
echo.
echo  لترك التطبيق يعمل في الخلفية:
echo    1. لا تُغلق هذه النافذة
echo    2. صغّرها (Minimize)
echo.
echo  To keep app running in background:
echo    1. Do NOT close this window
echo    2. Just minimize it
echo.
echo  لإيقاف التطبيق: اضغط Ctrl + C أو استخدم stop-moto-world.bat
echo  To stop: press Ctrl + C or use stop-moto-world.bat
echo  ============================================================
echo.

REM Change to the project directory (same folder as this .bat file)
cd /d "%~dp0"

REM Start the production server
npm run start

echo.
echo  ============================================================
echo  توقف التطبيق. اضغط أي زر للإغلاق
echo  Application stopped. Press any key to close.
echo  ============================================================
pause >nul

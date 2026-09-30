@echo off
cd /d "%~dp0"
echo Building Moto World 29...
echo.
call npm run electron:build
echo.
echo ============================================
echo Build finished. Exit code: %errorlevel%
echo ============================================
echo.
echo Check dist\ folder for the exe file.
echo.
pause

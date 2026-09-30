@echo off
REM ============================================================
REM  موتو ورلد 29 - أداة التشخيص الشاملة
REM  Moto World 29 - Comprehensive Diagnostics Tool
REM ============================================================
REM
REM  هذه الأداة تنشئ تقريراً كاملاً بكل الأخطاء:
REM  1. تقرير أثناء البناء (build-log.txt)
REM  2. تقرير أثناء التشغيل (runtime-log.txt)
REM  3. تقرير شامل (diagnostic-report.txt)
REM
REM  الاستخدام: انقر مرتين على diagnose.bat
REM  عند الانتهاء، ستجد الملفات في مجلد diagnostics\
REM  انسخها كلها وأرسلها للمساعد الذكي
REM
REM ============================================================

title موتو ورلد 29 - أداة التشخيص
color 0C

cd /d "%~dp0"

echo.
echo  ============================================================
echo            موتو ورلد 29 - أداة التشخيص الشاملة
echo            Moto World 29 - Diagnostics Tool
echo  ============================================================
echo.

REM ============================================================
REM 0. إنشاء مجلد diagnostics
REM ============================================================
if not exist "diagnostics" mkdir "diagnostics"

set "BUILD_LOG=%~dp0diagnostics\build-log.txt"
set "RUNTIME_LOG=%~dp0diagnostics\runtime-log.txt"
set "REPORT_LOG=%~dp0diagnostics\diagnostic-report.txt"
set "ERRORS_LOG=%~dp0diagnostics\errors-only.txt"

REM حذف التقارير القديمة
if exist "%BUILD_LOG%" del "%BUILD_LOG%"
if exist "%RUNTIME_LOG%" del "%RUNTIME_LOG%"
if exist "%REPORT_LOG%" del "%REPORT_LOG%"
if exist "%ERRORS_LOG%" del "%ERRORS_LOG%"

echo  [0/8] إنشاء مجلد diagnostics ✓
echo.

REM ============================================================
REM 1. معلومات النظام
REM ============================================================
echo  [1/8] جمع معلومات النظام...
echo.

(
  echo ============================================================
  echo  تقرير تشخيص موتو ورلد 29
  echo  Diagnostic Report - Moto World 29
  echo ============================================================
  echo.
  echo  تاريخ التقرير: %DATE% %TIME%
  echo  المشروع: moto-world-29
  echo.
  echo ============================================================
  echo  1. معلومات النظام (System Information)
  echo ============================================================
  echo.
  echo  --- نظام التشغيل (OS) ---
  ver
  echo.
  echo  --- اسم الكمبيوتر ---
  hostname
  echo.
  echo  --- اسم المستخدم ---
  echo  %USERNAME%
  echo.
  echo  --- المسار الحالي ---
  echo  %CD%
  echo.
  echo  --- معالج ---
  wmic cpu get name /value 2>nul | findstr "="
  echo.
  echo  --- ذاكرة RAM ---
  wmic OS get TotalVisibleMemorySize /value 2>nul | findstr "="
  echo.
  echo  --- مساحة القرص C ---
  wmic logicaldisk where "DeviceID='C:'" get FreeSpace,Size /value 2>nul | findstr "="
  echo.
) > "%REPORT_LOG%"

echo  [1/8] معلومات النظام ✓
echo.

REM ============================================================
REM 2. فحص المتطلبات (Node.js, npm, Git)
REM ============================================================
echo  [2/8] فحص المتطلبات...

(
  echo ============================================================
  echo  2. فحص المتطلبات (Requirements Check)
  echo ============================================================
  echo.
  echo  --- Node.js ---
  where node 2>nul
  if errorlevel 1 (
    echo  ❌ Node.js غير مثبت!
    echo  node_NOT_FOUND
  ) else (
    node --version
    echo  ✓ Node.js موجود
  )
  echo.
  echo  --- npm ---
  where npm 2>nul
  if errorlevel 1 (
    echo  ❌ npm غير موجود!
    echo  npm_NOT_FOUND
  ) else (
    npm --version
    echo  ✓ npm موجود
  )
  echo.
  echo  --- Git ---
  where git 2>nul
  if errorlevel 1 (
    echo  ❌ Git غير مثبت!
    echo  git_NOT_FOUND
  ) else (
    git --version
    echo  ✓ Git موجود
  )
  echo.
  echo  --- npx ---
  where npx 2>nul
  if errorlevel 1 (
    echo  ❌ npx غير موجود!
  ) else (
    npx --version
    echo  ✓ npx موجود
  )
  echo.
) >> "%REPORT_LOG%"

echo  [2/8] فحص المتطلبات ✓
echo.

REM ============================================================
REM 3. فحص ملفات المشروع
REM ============================================================
echo  [3/8] فحص ملفات المشروع...

(
  echo ============================================================
  echo  3. فحص ملفات المشروع (Project Files Check)
  echo ============================================================
  echo.
  echo  --- الملفات الأساسية ---
  if exist "package.json" ( echo  ✓ package.json موجود ) else ( echo  ❌ package.json مفقود! )
  if exist "next.config.ts" ( echo  ✓ next.config.ts موجود ) else ( echo  ❌ next.config.ts مفقود! )
  if exist ".env" ( echo  ✓ .env موجود ) else ( echo  ⚠ .env مفقود — شغّل: copy .env.example .env )
  if exist ".env.example" ( echo  ✓ .env.example موجود ) else ( echo  ❌ .env.example مفقود! )
  if exist ".env.production" ( echo  ✓ .env.production موجود ) else ( echo  ⚠ .env.production مفقود )
  if exist "tsconfig.json" ( echo  ✓ tsconfig.json موجود ) else ( echo  ❌ tsconfig.json مفقود! )
  if exist "tailwind.config.ts" ( echo  ✓ tailwind.config.ts موجود ) else ( echo  ❌ tailwind.config.ts مفقود! )
  if exist "eslint.config.mjs" ( echo  ✓ eslint.config.mjs موجود ) else ( echo  ❌ eslint.config.mjs مفقود! )
  echo.
  echo  --- ملفات Electron ---
  if exist "electron\main.js" ( echo  ✓ electron\main.js موجود ) else ( echo  ❌ electron\main.js مفقود! )
  if exist "electron\preload.js" ( echo  ✓ electron\preload.js موجود ) else ( echo  ❌ electron\preload.js مفقود! )
  echo.
  echo  --- ملفات Prisma ---
  if exist "prisma\schema.prisma" ( echo  ✓ prisma\schema.prisma موجود ) else ( echo  ❌ prisma\schema.prisma مفقود! )
  if exist "prisma\template.db" ( echo  ✓ prisma\template.db موجود ) else ( echo  ⚠ prisma\template.db مفقود — سينشأ أثناء البناء )
  echo.
  echo  --- مجلد public ---
  if exist "public\moto-world-logo.jpg" ( echo  ✓ public\moto-world-logo.jpg موجود ) else ( echo  ❌ شعار مفقود! )
  if exist "public\manifest.json" ( echo  ✓ public\manifest.json موجود ) else ( echo  ⚠ manifest.json مفقود )
  echo.
  echo  --- node_modules ---
  if exist "node_modules" ( echo  ✓ node_modules موجود ) else ( echo  ❌ node_modules مفقود — شغّل: npm install )
  if exist "node_modules\.prisma" ( echo  ✓ node_modules\.prisma موجود ) else ( echo  ❌ node_modules\.prisma مفقود — شغّل: npx prisma generate )
  if exist "node_modules\@prisma\client" ( echo  ✓ node_modules\@prisma\client موجود ) else ( echo  ❌ @prisma/client مفقود )
  if exist "node_modules\@prisma\engines" ( echo  ✓ node_modules\@prisma\engines موجود ) else ( echo  ❌ @prisma/engines مفقود )
  if exist "node_modules\electron" ( echo  ✓ node_modules\electron موجود ) else ( echo  ❌ electron مفقود — شغّل: npm install )
  if exist "node_modules\electron-builder" ( echo  ✓ node_modules\electron-builder موجود ) else ( echo  ❌ electron-builder مفقود )
  echo.
  echo  --- مجلد .next (بعد البناء) ---
  if exist ".next\standalone\server.js" ( echo  ✓ .next\standalone\server.js موجود ) else ( echo  ⚠ standalone غير موجود — البناء لم يكتمل بعد )
  if exist ".next\standalone\public" ( echo  ✓ .next\standalone\public موجود ) else ( echo  ⚠ standalone\public مفقود )
  if exist ".next\standalone\node_modules\.prisma" ( echo  ✓ standalone Prisma موجود ) else ( echo  ⚠ standalone Prisma مفقود )
  echo.
  echo  --- مجلد dist (بعد electron-builder) ---
  if exist "dist" (
    echo  ✓ dist موجود
    dir /b "dist\*.exe" 2>nul
  ) else (
    echo  ⚠ dist مفقود — electron-builder لم يُشغّل بعد
  )
  echo.
) >> "%REPORT_LOG%"

echo  [3/8] فحص ملفات المشروع ✓
echo.

REM ============================================================
REM 4. فحص package.json
REM ============================================================
echo  [4/8] فحص package.json...

(
  echo ============================================================
  echo  4. محتوى package.json
  echo ============================================================
  echo.
  type "package.json"
  echo.
) >> "%REPORT_LOG%"

echo  [4/8] فحص package.json ✓
echo.

REM ============================================================
REM 5. البناء الفعلي (إذا لم يكن standalone موجوداً)
REM ============================================================
echo  [5/8] بناء التطبيق (قد يستغرق وقتاً)...
echo.

(
  echo ============================================================
  echo  5. سجل البناء (Build Log)
  echo ============================================================
  echo.
  echo  بدء البناء: %DATE% %TIME%
  echo.
) > "%BUILD_LOG%"

REM فحص إذا كان node_modules موجوداً
if not exist "node_modules" (
  echo  [5a] تثبيت الاعتماديات...
  (
    echo  --- npm install ---
    call npm install 2>&1
    echo.
  ) >> "%BUILD_LOG%"
)

REM فحص إذا كان .env موجوداً
if not exist ".env" (
  echo  [5b] إنشاء .env...
  copy .env.example .env >nul
  (
    echo  --- تم إنشاء .env من .env.example ---
    echo.
  ) >> "%BUILD_LOG%"
)

REM إعداد قاعدة البيانات
echo  [5c] إعداد قاعدة البيانات...
(
  echo  --- prisma db push ---
  call npx prisma db push --accept-data-loss 2>&1
  echo.
) >> "%BUILD_LOG%"

REM البناء الفعلي
echo  [5d] بناء Next.js + Electron...
(
  echo  --- npm run electron:build ---
  echo  بدء: %DATE% %TIME%
  echo.
) >> "%BUILD_LOG%"

REM تشغيل البناء مع التقاط كل المخرجات
call npm run electron:build >> "%BUILD_LOG%" 2>&1
set BUILD_EXIT_CODE=%ERRORLEVEL%

(
  echo.
  echo  نهاية البناء: %DATE% %TIME%
  echo  كود الخروج: %BUILD_EXIT_CODE%
  echo.
  if %BUILD_EXIT_CODE% equ 0 (
    echo  ✓ البناء نجح
  ) else (
    echo  ❌ البناء فشل — كود الخروج: %BUILD_EXIT_CODE%
  )
  echo.
) >> "%BUILD_LOG%"

echo  [5/8] البناء اكتمل (كود الخروج: %BUILD_EXIT_CODE%)
echo.

REM ============================================================
REM 6. فحص نتائج البناء
REM ============================================================
echo  [6/8] فحص نتائج البناء...

(
  echo ============================================================
  echo  6. نتائج البناء (Build Results)
  echo ============================================================
  echo.
  echo  --- مجلد .next\standalone ---
  if exist ".next\standalone" (
    dir /b ".next\standalone" 2>nul
    echo.
    echo  --- standalone\server.js ---
    if exist ".next\standalone\server.js" (
      echo  ✓ server.js موجود
    ) else (
      echo  ❌ server.js مفقود!
    )
    echo.
    echo  --- standalone\public ---
    if exist ".next\standalone\public" (
      dir /b ".next\standalone\public" 2>nul
    ) else (
      echo  ❌ public مفقود في standalone!
    )
    echo.
    echo  --- standalone\electron ---
    if exist ".next\standalone\electron" (
      dir /b ".next\standalone\electron" 2>nul
    ) else (
      echo  ❌ electron مفقود في standalone!
    )
    echo.
    echo  --- standalone\node_modules\.prisma ---
    if exist ".next\standalone\node_modules\.prisma" (
      dir /b ".next\standalone\node_modules\.prisma\client" 2>nul | findstr "engine"
    ) else (
      echo  ❌ .prisma مفقود في standalone!
    )
    echo.
    echo  --- standalone\node_modules\@prisma\engines ---
    if exist ".next\standalone\node_modules\@prisma\engines" (
      dir /b ".next\standalone\node_modules\@prisma\engines" 2>nul
    ) else (
      echo  ❌ @prisma\engines مفقود في standalone!
    )
  ) else (
    echo  ❌ مجلد standalone غير موجود — البناء فشل!
  )
  echo.
  echo  --- مجلد dist ---
  if exist "dist" (
    dir /b "dist" 2>nul
    echo.
    echo  --- ملفات exe ---
    dir /b "dist\*.exe" 2>nul
    if errorlevel 1 echo  ❌ لا يوجد ملف exe في dist!
  ) else (
    echo  ❌ dist غير موجود — electron-builder لم يُشغّل!
  )
  echo.
  echo  --- prisma\template.db ---
  if exist "prisma\template.db" (
    echo  ✓ template.db موجود
    for %%A in ("prisma\template.db") do echo  الحجم: %%~zA bytes
  ) else (
    echo  ❌ template.db مفقود!
  )
  echo.
) >> "%REPORT_LOG%"

echo  [6/8] فحص نتائج البناء ✓
echo.

REM ============================================================
REM 7. اختبار تشغيل التطبيق (إذا وجد exe)
REM ============================================================
echo  [7/8] اختبار تشغيل التطبيق...
echo.

(
  echo ============================================================
  echo  7. سجل التشغيل (Runtime Log)
  echo ============================================================
  echo.
  echo  بدء الاختبار: %DATE% %TIME%
  echo.
) > "%RUNTIME_LOG%"

REM البحث عن ملف exe
set "EXE_FILE="
for %%f in ("dist\Moto World 29*.exe") do set "EXE_FILE=%%f"

if "%EXE_FILE%"=="" (
  echo  ⚠ لا يوجد ملف exe — تخطي اختبار التشغيل
  (
    echo  ⚠ لا يوجد ملف exe — تخطي اختبار التشغيل
    echo.
  ) >> "%RUNTIME_LOG%"
) else (
  echo  تم العثور على: %EXE_FILE%
  (
    echo  تم العثور على: %EXE_FILE%
    echo.
    echo  --- حجم الملف ---
    for %%A in ("%EXE_FILE%") do echo  الحجم: %%~zA bytes
    echo.
    echo  --- تشغيل التطبيق (15 ثانية) ---
    echo  بدء: %DATE% %TIME%
    echo.
  ) >> "%RUNTIME_LOG%"

  REM تشغيل التطبيق في الخلفية
  start "" "%EXE_FILE%"

  REM انتظار 15 ثانية
  echo  انتظار 15 ثانية...
  timeout /t 15 /nobreak >nul

  REM فحص إذا كان التطبيق يعمل
  (
    echo  --- فحص العمليات ---
    echo  البحث عن Moto World 29...
    tasklist | findstr /i "Moto World"
    if errorlevel 1 (
      echo  ❌ التطبيق لا يعمل! تعطل فوراً.
    ) else (
      echo  ✓ التطبيق يعمل
    )
    echo.
    echo  --- البحث عن node.exe (الخادم) ---
    tasklist | findstr /i "node"
    if errorlevel 1 (
      echo  ⚠ لا يوجد node.exe — الخادم لم يبدأ
    ) else (
      echo  ✓ node.exe يعمل
    )
    echo.
    echo  --- اختبار HTTP (localhost:3000) ---
    echo  محاولة الاتصال بـ http://127.0.0.1:3000...
    powershell -command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -TimeoutSec 5 -UseBasicParsing; Write-Host 'HTTP Status:' $r.StatusCode } catch { Write-Host 'Error:' $_.Exception.Message }" 2>&1
    echo.
    echo  --- اختبار HTTP (localhost:3001) ---
    powershell -command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001' -TimeoutSec 5 -UseBasicParsing; Write-Host 'HTTP Status:' $r.StatusCode } catch { Write-Host 'Error:' $_.Exception.Message }" 2>&1
    echo.
    echo  --- المنافذ المستمعة ---
    netstat -ano | findstr "LISTENING" | findstr "3000\|3001\|3002"
    echo.
  ) >> "%RUNTIME_LOG%"

  REM إيقاف التطبيق
  echo  إيقاف التطبيق...
  taskkill /f /im "Moto World 29.exe" 2>nul
  taskkill /f /im node.exe 2>nul

  (
    echo  --- تم إيقاف التطبيق ---
    echo  نهاية الاختبار: %DATE% %TIME%
    echo.
  ) >> "%RUNTIME_LOG%"
)

echo  [7/8] اختبار التشغيل اكتمل
echo.

REM ============================================================
REM 8. جمع سجلات التطبيق (AppData logs)
REM ============================================================
echo  [8/8] جمع سجلات التطبيق من AppData...

(
  echo ============================================================
  echo  8. سجلات التطبيق (AppData Logs)
  echo ============================================================
  echo.
) >> "%REPORT_LOG%"

set "APPDATA_LOGS=%APPDATA%\Moto World 29\logs"

if exist "%APPDATA_LOGS%" (
  echo  ✓ وجدت السجلات في: %APPDATA_LOGS%
  (
    echo  ✓ وجدت السجلات في: %APPDATA_LOGS%
    echo.
    echo  --- محتويات المجلد ---
    dir "%APPDATA_LOGS%" 2>nul
    echo.
    echo  --- آخر ملف سجل ---
    echo.
  ) >> "%REPORT_LOG%"

  REM نسخ آخر ملف سجل
  for /f "delims=" %%f in ('dir /b /o-d "%APPDATA_LOGS%\*.log" 2^>nul') do (
    set "LATEST_LOG=%%f"
    goto :found_log
  )
  :found_log
  if defined LATEST_LOG (
    echo  نسخ السجل: %LATEST_LOG%
    (
      echo  --- محتوى %LATEST_LOG% ---
      echo.
      type "%APPDATA_LOGS%\%LATEST_LOG%"
      echo.
    ) >> "%REPORT_LOG%"
  )
) else (
  echo  ⚠ لا توجد سجلات في AppData — التطبيق لم يُشغّل مطلقاً
  (
    echo  ⚠ لا توجد سجلات في AppData — التطبيق لم يُشغّل مطلقاً
    echo  المسار المتوقع: %APPDATA_LOGS%
    echo.
  ) >> "%REPORT_LOG%"
)

echo  [8/8] جمع السجلات اكتمل
echo.

REM ============================================================
REM استخراج الأخطاء فقط
REM ============================================================
echo  استخراج الأخطاء...

(
  echo ============================================================
  echo  الأخطاء المكتشفة فقط (Errors Only)
  echo ============================================================
  echo.
  echo  --- من build-log.txt ---
  echo.
  findstr /i /c:"error" /c:"❌" /c:"fail" /c:"FATAL" "%BUILD_LOG%" 2>nul
  echo.
  echo  --- من runtime-log.txt ---
  echo.
  findstr /i /c:"error" /c:"❌" /c:"fail" /c:"FATAL" "%RUNTIME_LOG%" 2>nul
  echo.
  echo  --- من diagnostic-report.txt ---
  echo.
  findstr /i /c:"error" /c:"❌" /c:"fail" /c:"FATAL" /c:"missing" /c:"مفقود" "%REPORT_LOG%" 2>nul
  echo.
) > "%ERRORS_LOG%"

echo  ✓ تم استخراج الأخطاء
echo.

REM ============================================================
REM إضافة ملخص نهائي للتقرير
REM ============================================================
(
  echo ============================================================
  echo  9. ملخص تشخيصي (Diagnostic Summary)
  echo ============================================================
  echo.
  echo  --- حالة البناء ---
  if %BUILD_EXIT_CODE% equ 0 (
    echo  ✓ البناء نجح (كود الخروج: 0)
  ) else (
    echo  ❌ البناء فشل (كود الخروج: %BUILD_EXIT_CODE%)
    echo  راجع build-log.txt للتفاصيل
  )
  echo.
  echo  --- ملف exe ---
  if "%EXE_FILE%"=="" (
    echo  ❌ لم يتم إنشاء ملف exe
  ) else (
    echo  ✓ تم إنشاء: %EXE_FILE%
  )
  echo.
  echo  --- ملفات حرجة ---
  if exist ".next\standalone\server.js" ( echo  ✓ standalone\server.js ) else ( echo  ❌ standalone\server.js مفقود )
  if exist ".next\standalone\node_modules\.prisma" ( echo  ✓ standalone Prisma ) else ( echo  ❌ standalone Prisma مفقود )
  if exist "prisma\template.db" ( echo  ✓ template.db ) else ( echo  ❌ template.db مفقود )
  echo.
  echo  --- ملفات تم إنشاؤها ---
  echo  1. diagnostics\diagnostic-report.txt  - التقرير الشامل
  echo  2. diagnostics\build-log.txt          - سجل البناء الكامل
  echo  3. diagnostics\runtime-log.txt        - سجل التشغيل
  echo  4. diagnostics\errors-only.txt        - الأخطاء فقط
  echo.
  echo  ============================================================
  echo  انسخ كل هذه الملفات وأرسلها للمساعد الذكي
  echo  Send all these files to your AI assistant
  echo  ============================================================
) >> "%REPORT_LOG%"

REM ============================================================
REM النتيجة النهائية
REM ============================================================
echo  ============================================================
echo  ✅  اكتمل التشخيص!
echo  ============================================================
echo.
echo  📁 الملفات التي تم إنشاؤها في مجلد diagnostics\:
echo.
echo     1. diagnostic-report.txt  - التقرير الشامل
echo     2. build-log.txt          - سجل البناء الكامل
echo     3. runtime-log.txt        - سجل التشغيل
echo     4. errors-only.txt        - الأخطاء فقط (مهم!)
echo.
echo  📋 ما يجب فعله:
echo.
echo     1. افتح مجلد diagnostics\
echo        (استكشف: %~dp0diagnostics\)
echo     2. انسخ كل الملفات
echo     3. أرسلها للمساعد الذكي مع وصف المشكلة
echo.
echo  ============================================================

REM فتح مجلد diagnostics تلقائياً
explorer "%~dp0diagnostics"

pause

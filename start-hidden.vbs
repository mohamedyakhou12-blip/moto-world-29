' ============================================================
'  موتو ورلد 29 - تشغيل التطبيق في الخلفية (مخفي تماماً)
'  Moto World 29 - Run App Hidden in Background
' ============================================================
'
'  الاستخدام: انقر مرتين على هذا الملف
'  Usage: Double-click this file
'
'  سيتم تشغيل التطبيق في الخلفية بدون أي نافذة ظاهرة
'  The app will run in the background with NO visible window
'
'  ثم افتح المتصفح على: http://localhost:3000
'  Then open your browser at: http://localhost:3000
'
'  لإيقاف التطبيق: استخدم stop-moto-world.bat
'  To stop: use stop-moto-world.bat
'
' ============================================================

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
strFolder = fso.GetParentFolderName(WScript.ScriptFullName)

' Run the batch file hidden (0 = hidden window)
WshShell.Run "cmd /c cd /d """ & strFolder & """ && npm run start", 0, False

' Wait a few seconds for the server to start
WScript.Sleep 3000

' Open the default browser
WshShell.Run "http://localhost:3000"

# 🖥️ بناء ملف .exe لتطبيق موتو ورلد 29

دليل كامل لإنشاء ملف `.exe` حقيقي (نافذة أصلية، ليست متصفحاً) باستخدام Electron.

---

## ✅ النتيجة النهائية

ملف `Moto World 29.exe` — انقر مرتين → تفتح **نافذة أصلية** للتطبيق مباشرة.

---

## 📋 المتطلبات (مرة واحدة)

### 1. ثبّت Node.js LTS
- حمّل من: **https://nodejs.org** (اختر LTS)
- ثبّت بالإعدادات الافتراضية

### 2. ثبّت Git
- حمّل من: **https://git-scm.com/download/win**

### 3. ثبّت Visual Studio C++ Build Tools (مطلوب من Electron)
- حمّل من: **https://visualstudio.microsoft.com/visual-cpp-build-tools/**
- عند التثبيت، اختر: **"Desktop development with C++"**

---

## 🚀 خطوات البناء

### 1️⃣ حمّل الكود

افتح **PowerShell** أو **موجّه الأوامر (cmd)**:

```bash
cd Desktop
git clone https://github.com/mohamedyakhou12-blip/moto-world-29.git
cd moto-world-29
```

### 2️⃣ ثبّت الاعتماديات

```bash
npm install
```

⏳ هذا سيستغرق **5-10 دقائق** (يحمّل Electron + electron-builder + كل الحزم).

### 3️⃣ أنشئ قاعدة البيانات المحلية (للتطوير)

```bash
copy .env.example .env
npm run db:push
```

### 4️⃣ ابني ملف .exe 🎯

```bash
npm run electron:build
```

⏳ هذا سيستغرق **3-8 دقائق**. ستظهر رسائل مثل:

```
✓ next build (تم)
✓ نسخ الملفات (تم)
✓ prisma template (تم)
• electron-builder:
  • building        target=portable arch=x64
  • building block map
  ⚡ done
```

### 5️⃣ ستجد الملف هنا 📁

```
dist/
  └── Moto World 29.exe    ← هذا هو ملفك!
```

**حجم الملف:** ~80-120 MB (يتضمن Node.js + Chromium + التطبيق)

---

## 🎉 كيفية الاستخدام

### على جهازك:
1. انسخ `Moto World 29.exe` إلى سطح المكتب
2. انقر مرتين → تفتح **نافذة أصلية** فوراً
3. لا يحتاج أي تثبيت — يعمل مباشرة (Portable)

### على جهاز آخر (بدون Node.js):
- انسخ `Moto World 29.exe` فقط إلى أي جهاز ويندوز
- انقر مرتين → يعمل! لا يحتاج شيئاً مثبتاً مسبقاً
- بياناتك تُحفظ في: `C:\Users\<اسمك>\AppData\Roaming\Moto World 29\`

---

## 🔄 إعادة البناء بعد تعديل الكود

```bash
git pull              # تحميل التحديثات من GitHub
npm run electron:build  # إعادة بناء الـ exe
```

---

## 🛠️ أوامر مفيدة

| الأمر | الوصف |
|-------|-------|
| `npm run electron:build` | بناء ملف .exe كامل |
| `npm run electron:dev` | تشغيل في وضع التطوير (للاختبار) |
| `npm run build` | بناء Next.js فقط (بدون exe) |
| `npm run dev` | تشغيل في المتصفح (للتطوير) |

---

## 🆘 حل المشاكل

### المشكلة: `Error: Cannot find module 'electron'`
```bash
npm install electron --save-dev
```

### المشكلة: `EBUilderError: cannot find 7z`
electron-builder سيحاول تحميل الأدوات تلقائياً. إذا فشل:
```bash
npm install 7zip-bin --save-dev
```

### المشكلة: بطء البناء جداً
- هذا طبيعي في المرة الأولى (يحمّل أدوات electron-builder)
- المرات التالية ستكون أسرع

### المشكلة: النافذة تفتح ثم تُغلق فوراً
- تأكد من تشغيل `npm run build` قبل `electron:dev`
- تحقق من سجل الأخطاء في:
  `C:\Users\<اسمك>\AppData\Roaming\Moto World 29\logs\`

### المشكلة: `EADDRINUSE` (المنفذ مستخدم)
- أغلق أي نسخة أخرى من التطبيق
- أغلق المتصفح إذا كان يفتح localhost:3000

---

## 📝 ملاحظات

1. **قاعدة البيانات**: تُحفظ في `AppData/Roaming/Moto World 29/custom.db` — تبقى محفوظة بعد إغلاق التطبيق.

2. **التحديثات**: بعد تعديل الكود على GitHub، شغّل:
   ```bash
   git pull
   npm install
   npm run electron:build
   ```

3. **الأيقونة**: التطبيق يستخدم أيقونة افتراضية من Electron. لإضافة شعارك الخاص، أنشئ ملف `build/icon.ico` (256×256) ثم أعد البناء.

4. **الحجم**: ملف exe كبير (~100MB) لأنه يتضمن:
   - Node.js runtime
   - Chromium (محرك المتصفح)
   - كل كود التطبيق + قاعدة البيانات

---

## 🆚 الفرق بين الأنواع

| النوع | الوصف |
|-------|-------|
| **portable** | ملف exe واحد، يعمل بدون تثبيت (المستخدم) |
| **nsis** | مثبّت (installer) يثبت التطبيق في Program Files |
| **appx** | حزمة متجر ويندوز (MS Store) |

الإعداد الحالي يستخدم **portable** (الأسهل).

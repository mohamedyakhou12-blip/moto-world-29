# 📱 موتو ورلد 29 — نسخة الهاتف (Android APK)

نفس تطبيق الكمبيوتر، لكن لـ Android. يعمل بدون إنترنت، البيانات محفوظة على الهاتف.

## ✅ الميزات (نفس نسخة الكمبيوتر):

- 📊 **لوحة القيادة** — أرباح اليوم/الشهر + قيمة المخزون + الأكثر مبيعاً + مخزون منخفض
- 📦 **المخزون** — إضافة/تعديل/حذف المنتجات + بحث
- 🛒 **نقطة البيع** — إنشاء بون + سلة + اسم زبون + خصم + **مشاركة PDF**
- 🚚 **المشتريات** — تزويد قطع موجودة + قطع جديدة بالشراء
- 🧾 **البونات** — سجل كامل + بحث + **مشاركة PDF**
- 📈 **التقارير** — يومي/شهري + رسم بياني
- ⚙️ **الإعدادات** — اسم المتجر + العملة مقفولة (دج) + بيانات تجريبية + reset
- 💾 **SQLite محلي** — كل البيانات على الهاتف

---

## 🚀 التشغيل السريع (بدون بناء APK):

### 1️⃣ ثبّت Node.js على الكمبيوتر
من: https://nodejs.org

### 2️⃣ ثبّت Expo على هاتفك
- من Google Play: ابحث عن "Expo Go" وثبّته

### 3️⃣ شغّل التطبيق على الكمبيوتر:

```bash
cd mobile
npm install
npx expo start
```

### 4️⃣ امسح QR code بـ Expo Go على هاتفك
- التطبيق يعمل فوراً على هاتفك!
- البيانات تُحفظ على الهاتف

---

## 🔨 بناء APK حقيقي (يعمل بدون Expo Go):

### الطريقة 1: EAS Build (الأسهل — سحابي)

```bash
cd mobile
npm install
npx eas-cli login
# أنشئ حساب مجاني على expo.dev
npx eas-cli build -p android --profile preview
```

- ستحصل على رابط تحميل APK
- حمّله على هاتفك وثبّته
- يعمل بدون Expo Go وبدون إنترنت

### الطريقة 2: بناء محلي (يحتاج Android Studio)

```bash
cd mobile
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

- APK في: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📋 المتطلبات:

- Node.js 18+
- هاتف Android 8.0+
- للاختبار السريع: Expo Go (من Play Store)
- للبناء: حساب Expo مجاني (expo.dev)

---

## 🎨 التصميم:

- نفس ألوان نسخة الكمبيوتر (أحمر/أسود/فضي)
- واجهة عربية RTL
- عملة الدينار الجزائري (دج) مقفولة
- خط النظام (يدعم العربية)

---

## 📁 بنية المشروع:

```
mobile/
├── App.tsx                    ← نقطة الدخول + التنقل
├── app.json                   ← إعدادات Expo
├── eas.json                   ← إعدادات البناء
├── package.json
├── babel.config.js
├── tsconfig.json
└── src/
    ├── db/
    │   └── database.ts        ← قاعدة البيانات (SQLite)
    ├── components/
    │   └── ui.tsx             ← مكونات مشتركة
    ├── screens/
    │   ├── Dashboard.tsx      ← لوحة القيادة
    │   ├── Inventory.tsx      ← المخزون
    │   ├── POS.tsx            ← نقطة البيع
    │   ├── Purchases.tsx      ← المشتريات
    │   ├── Receipts.tsx       ← البونات
    │   ├── Reports.tsx        ← التقارير
    │   └── Settings.tsx       ← الإعدادات
    └── utils/
        └── format.ts          ← أدوات التنسيق
```

---

## 🆘 حل المشاكل:

### "Unable to resolve module"
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### "Database not initialized"
- تأكد أن `expo-sqlite` مثبت: `npm install expo-sqlite`

### APK لا يُبنى
- استخدم EAS Build (الطريقة 1) — أسهل

---

## 📞 ملاحظات:

- التطبيق **مستقل** عن نسخة الكمبيوتر (قاعدة بيانات منفصلة على الهاتف)
- لا تتم مزامنة بين الهاتف والكمبيوتر
- البيانات محفوظة محلياً على الهاتف فقط

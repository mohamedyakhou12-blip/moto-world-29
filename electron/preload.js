// ============================================================
//  موتو ورلد 29 - Preload Script
//  بريمج التحميل المسبق لإلكترون
// ============================================================
// هذا الملف يعمل في سياق معزول بين Node.js والصفحة
// This file runs in an isolated context between Node.js and the page

window.addEventListener('DOMContentLoaded', () => {
  // تعطيل قائمة السياق الافتراضية والاختصارات في الإنتاج
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => {
      // اسمح بقائمة السياق في حقول الإدخال فقط
      const tag = e.target.tagName.toLowerCase()
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault()
      }
    })
  }

  console.log('[Preload] موتو ورلد 29 جاهز')
})

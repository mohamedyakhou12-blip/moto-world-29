// ============================================================
//  موتو ورلد 29 - Preload Script
// ============================================================

// منع قائمة السياق خارج حقول الإدخال (أبسط، بدون فحص NODE_ENV)
window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('contextmenu', (e) => {
    const tag = (e.target.tagName || '').toLowerCase()
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault()
    }
  })
})

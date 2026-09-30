// Currency / number formatting helpers — Algerian Dinar (DZD / دج)

export function formatMoney(value: number, currency = 'دج'): string {
  const v = Number.isFinite(value) ? value : 0
  const formatted = v.toLocaleString('ar-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${formatted} ${currency}`
}

export function formatNumber(value: number): string {
  const v = Number.isFinite(value) ? value : 0
  return v.toLocaleString('ar-DZ')
}

export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('ar-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('ar-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' })
}

// Arabic day short names (Sun..Sat)
export const DAY_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

// Arabic month names
export const MONTH_NAMES_AR = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export function arabicMonthName(monthIndex: number): string {
  return MONTH_NAMES_AR[monthIndex] || ''
}

export const CATEGORIES = [
  { value: 'PIECES', label: 'قطع الغيار' },
  { value: 'ACCESSOIRES', label: 'إكسسوارات' },
  { value: 'EQUIPEMENTS', label: 'معدات' },
] as const

export type CategoryValue = (typeof CATEGORIES)[number]['value']

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label || value
}

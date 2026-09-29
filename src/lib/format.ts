// Currency / number formatting helpers

export function formatMoney(value: number, currency = 'DH'): string {
  const v = Number.isFinite(value) ? value : 0
  const formatted = v.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${formatted} ${currency}`
}

export function formatNumber(value: number): string {
  const v = Number.isFinite(value) ? value : 0
  return v.toLocaleString('fr-FR')
}

export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('fr-FR', {
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
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export const CATEGORIES = [
  { value: 'PIECES', label: 'Pièces Moto' },
  { value: 'ACCESSOIRES', label: 'Accessoires Moto' },
  { value: 'EQUIPEMENTS', label: 'Équipements Moto' },
] as const

export type CategoryValue = (typeof CATEGORIES)[number]['value']

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label || value
}

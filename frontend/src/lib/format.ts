import { format, isToday, isYesterday, differenceInDays } from 'date-fns'

export function formatTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function fmtDur(s: number | null): string | null {
  if (!s) return null
  const m = Math.floor(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

export function dateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d))     return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  const diff = differenceInDays(new Date(), d)
  if (diff < 7) return format(d, 'EEEE')
  return format(d, 'MMM d, yyyy')
}

import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from 'date-fns'

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function getRelativeTime(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

export function formatDaysOverdue(date: Date | string): number {
  const ms = new Date().getTime() - new Date(date).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return isPast(new Date(date)) && !isToday(new Date(date))
}

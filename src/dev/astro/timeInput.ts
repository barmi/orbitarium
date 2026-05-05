export function dateToUtcInputValue(date: Date): string {
  const y = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const h = String(date.getUTCHours()).padStart(2, '0')
  const mi = String(date.getUTCMinutes()).padStart(2, '0')
  const s = String(date.getUTCSeconds()).padStart(2, '0')
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`
}

export function parseUtcInput(value: string): Date | null {
  const date = new Date(`${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

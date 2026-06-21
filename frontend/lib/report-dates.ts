export function formatReportDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parseReportDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(year, month - 1, day)
}

export function getDefaultReportDateRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 30)

  return {
    from: formatReportDateKey(from),
    to: formatReportDateKey(to),
  }
}

export function isValidReportDateRange(from: string, to: string): boolean {
  if (!from || !to) {
    return false
  }

  return from <= to
}

export function formatReportDateLabel(value: string): string {
  const [year, month, day] = value.split('-')

  if (!year || !month || !day) {
    return value
  }

  return `${year}/${month}/${day}`
}

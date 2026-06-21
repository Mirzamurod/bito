const reportCache = new Map<string, { data: unknown; expiresAt: number }>()

export function getReportCacheKey(tenantId: string, from: string, to: string): string {
  return `report:${tenantId}:${from}:${to}`
}

export function getCachedReport<T>(key: string): T | null {
  const entry = reportCache.get(key)

  if (!entry) {
    return null
  }

  if (Date.now() > entry.expiresAt) {
    reportCache.delete(key)
    return null
  }

  return entry.data as T
}

export function setCachedReport(key: string, data: unknown, ttlMs: number): void {
  reportCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
}

export function invalidateTenantReportCache(tenantId: string): void {
  const prefix = `report:${tenantId}:`

  for (const key of reportCache.keys()) {
    if (key.startsWith(prefix)) {
      reportCache.delete(key)
    }
  }
}

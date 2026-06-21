export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export function parsePagination(pageRaw?: string, limitRaw?: string): PaginationParams {
  const page = pageRaw ? Number(pageRaw) : DEFAULT_PAGE
  const limit = limitRaw ? Number(limitRaw) : DEFAULT_LIMIT

  if (!Number.isInteger(page) || page < 1) {
    throw new Error('INVALID_PAGE')
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new Error('INVALID_LIMIT')
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

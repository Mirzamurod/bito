const knownErrorCodes = [
  'INSUFFICIENT_STOCK',
  'PRODUCT_NOT_FOUND',
  'INVALID_CART',
  'ORDER_NOT_FOUND',
  'INVALID_ORDER_STATE',
  'INVALID_DATE',
  'INVALID_DATE_RANGE',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'TENANT_INVALID',
  'INTERNAL_ERROR',
] as const

export type KnownErrorCode = (typeof knownErrorCodes)[number]

export function isKnownErrorCode(code: string): code is KnownErrorCode {
  return (knownErrorCodes as readonly string[]).includes(code)
}

export function getErrorMessageKey(code: string): KnownErrorCode | 'UNKNOWN_ERROR' {
  return isKnownErrorCode(code) ? code : 'UNKNOWN_ERROR'
}

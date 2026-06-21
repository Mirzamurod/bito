export interface ApiSuccessResponse<T> {
  data: T
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: unknown
}

export interface ApiErrorResponse {
  error: ApiErrorBody
}

export type UserRole = 'admin' | 'cashier'

export interface AuthUser {
  userId: string
  tenantId: string
  role: UserRole
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let body: ApiErrorResponse | undefined

    try {
      body = (await response.json()) as ApiErrorResponse
    } catch {
      // ignore invalid JSON
    }

    const code = body?.error?.code ?? 'UNKNOWN_ERROR'
    const message = body?.error?.message ?? response.statusText

    return new ApiError(response.status, code, message, body?.error?.details)
  }
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorResponse).error?.code === 'string'
  )
}

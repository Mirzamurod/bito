export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not set')
  }

  return baseUrl.replace(/\/$/, '')
}

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  accessToken?: string | null
  headers?: HeadersInit
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, accessToken, headers } = options

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const { ApiError } = await import('@/types/api')
    throw await ApiError.fromResponse(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const json = (await response.json()) as { data: T }
  return json.data
}

export function apiGet<T>(path: string, accessToken?: string | null): Promise<T> {
  return apiFetch<T>(path, { method: 'GET', accessToken })
}

export function apiPost<T>(path: string, body: unknown, accessToken?: string | null): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body, accessToken })
}

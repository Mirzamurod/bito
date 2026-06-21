import { auth } from '@/auth'

import { apiFetch, type ApiRequestOptions } from './api-client'

export async function getServerAccessToken(): Promise<string | null> {
  const session = await auth()
  return session?.accessToken ?? null
}

export async function serverApiFetch<T>(
  path: string,
  options: Omit<ApiRequestOptions, 'accessToken'> = {},
): Promise<T> {
  const accessToken = await getServerAccessToken()
  return apiFetch<T>(path, { ...options, accessToken })
}

export function serverApiGet<T>(path: string): Promise<T> {
  return serverApiFetch<T>(path, { method: 'GET' })
}

export function serverApiPost<T>(path: string, body: unknown): Promise<T> {
  return serverApiFetch<T>(path, { method: 'POST', body })
}

'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

import { apiFetch, apiGet, apiPost } from '@/lib/api-client'

export function useApiClient() {
  const { data: session } = useSession()
  const accessToken = session?.accessToken

  return useMemo(
    () => ({
      accessToken,
      get: <T>(path: string) => apiGet<T>(path, accessToken),
      post: <T>(path: string, body: unknown) => apiPost<T>(path, body, accessToken),
      fetch: <T>(path: string, options: Omit<Parameters<typeof apiFetch>[1], 'accessToken'>) =>
        apiFetch<T>(path, { ...options, accessToken }),
    }),
    [accessToken],
  )
}

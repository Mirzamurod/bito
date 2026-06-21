'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { useApiClient } from '@/hooks/use-api-client'
import { queryKeys } from '@/lib/query-keys'
import type { ProductListResult } from '@/types/product'

const DEFAULT_LIMIT = 20

export type UseProductsParams = {
  search: string
  page: number
  limit?: number
}

export function useProducts({ search, page, limit = DEFAULT_LIMIT }: UseProductsParams) {
  const { status } = useSession()
  const api = useApiClient()

  return useQuery({
    queryKey: queryKeys.products({ search, page, limit }),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })

      const trimmedSearch = search.trim()

      if (trimmedSearch) {
        params.set('search', trimmedSearch)
      }

      return api.get<ProductListResult>(`/api/products?${params.toString()}`)
    },
    enabled: status === 'authenticated' && Boolean(api.accessToken),
  })
}

export { DEFAULT_LIMIT as PRODUCTS_PAGE_LIMIT }

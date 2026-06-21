'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { useApiClient } from '@/hooks/use-api-client'
import { queryKeys } from '@/lib/query-keys'
import type { OrderReceipt } from '@/types/order'

const PENDING_POLL_INTERVAL_MS = 2000

export function useOrder(orderId: string) {
  const { status } = useSession()
  const api = useApiClient()

  return useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => api.get<OrderReceipt>(`/api/orders/${orderId}`),
    enabled: status === 'authenticated' && Boolean(api.accessToken) && Boolean(orderId),
    refetchInterval: query => {
      const order = query.state.data

      if (order?.status === 'pending_payment') {
        return PENDING_POLL_INTERVAL_MS
      }

      return false
    },
  })
}

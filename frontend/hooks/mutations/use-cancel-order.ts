'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '@/hooks/use-api-client'
import { queryKeys } from '@/lib/query-keys'
import type { Order } from '@/types/order'

export function useCancelOrder() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => api.post<Order>(`/api/orders/${orderId}/cancel`, {}),
    onSuccess: async (_, orderId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ])
    },
  })
}

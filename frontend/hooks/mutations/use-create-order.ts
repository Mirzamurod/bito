'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useApiClient } from '@/hooks/use-api-client'
import type { CreateOrderInput, Order } from '@/types/order'

export function useCreateOrder() {
  const api = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.post<Order>('/api/orders', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

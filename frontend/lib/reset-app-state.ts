import type { QueryClient } from '@tanstack/react-query'

import { useCartStore } from '@/lib/cart-store'

export function resetAppState(queryClient?: QueryClient): void {
  useCartStore.getState().clearCart()
  queryClient?.clear()
}

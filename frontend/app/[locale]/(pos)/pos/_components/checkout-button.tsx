'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useCreateOrder } from '@/hooks/mutations/use-create-order'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/lib/cart-store'
import { ApiError } from '@/types/api'

export function CheckoutButton() {
  const t = useTranslations('pos')
  const tCommon = useTranslations('common')
  const getErrorMessage = useApiErrorMessage()
  const router = useRouter()
  const createOrder = useCreateOrder()

  const items = useCartStore(state => state.items)
  const getCheckoutItems = useCartStore(state => state.getCheckoutItems)
  const clearCart = useCartStore(state => state.clearCart)
  const setStockErrorProductIds = useCartStore(state => state.setStockErrorProductIds)
  const clearStockErrors = useCartStore(state => state.clearStockErrors)

  const isEmpty = items.length === 0
  const isPending = createOrder.isPending

  function handleCheckout() {
    if (isEmpty || isPending) {
      return
    }

    clearStockErrors()

    const checkoutItems = getCheckoutItems()

    createOrder.mutate(
      { items: checkoutItems },
      {
        onSuccess: order => {
          clearCart()
          router.push(`/receipt/${order.id}`)
          router.refresh()
        },
        onError: error => {
          if (!(error instanceof ApiError)) {
            toast.error(getErrorMessage('UNKNOWN_ERROR'))
            return
          }

          toast.error(getErrorMessage(error.code))

          if (error.code === 'INSUFFICIENT_STOCK') {
            setStockErrorProductIds(checkoutItems.map(item => item.productId))
          }
        },
      },
    )
  }

  return (
    <Button
      className='w-full'
      type='button'
      disabled={isEmpty || isPending}
      onClick={handleCheckout}
    >
      {isPending ? tCommon('loading') : t('checkout')}
    </Button>
  )
}

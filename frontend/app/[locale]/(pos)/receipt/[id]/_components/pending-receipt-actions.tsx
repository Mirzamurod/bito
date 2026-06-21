'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useCancelOrder } from '@/hooks/mutations/use-cancel-order'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useRouter } from '@/i18n/navigation'
import { useCartStore } from '@/lib/cart-store'
import { ApiError } from '@/types/api'
import type { OrderReceipt } from '@/types/order'

import { SimulatePaymentButton } from './simulate-payment-button'

type PendingReceiptActionsProps = {
  order: OrderReceipt
}

export function PendingReceiptActions({ order }: PendingReceiptActionsProps) {
  const t = useTranslations('receipt')
  const tCommon = useTranslations('common')
  const getErrorMessage = useApiErrorMessage()
  const router = useRouter()
  const cancelOrder = useCancelOrder()

  const clearCart = useCartStore(state => state.clearCart)
  const restoreItemsFromOrder = useCartStore(state => state.restoreItemsFromOrder)

  const isPending = cancelOrder.isPending

  function handleCancelPayment() {
    if (isPending) {
      return
    }

    cancelOrder.mutate(order.id, {
      onSuccess: () => {
        clearCart()
        router.push('/pos')
        router.refresh()
      },
      onError: error => {
        if (!(error instanceof ApiError)) {
          toast.error(getErrorMessage('UNKNOWN_ERROR'))
          return
        }

        toast.error(getErrorMessage(error.code))
      },
    })
  }

  function handleAddItems() {
    if (isPending) {
      return
    }

    const orderItems = order.items ?? []

    cancelOrder.mutate(order.id, {
      onSuccess: () => {
        restoreItemsFromOrder(
          orderItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name,
            unitPrice: item.unitPrice,
          })),
        )
        router.push('/pos')
        router.refresh()
      },
      onError: error => {
        if (!(error instanceof ApiError)) {
          toast.error(getErrorMessage('UNKNOWN_ERROR'))
          return
        }

        toast.error(getErrorMessage(error.code))
      },
    })
  }

  return (
    <div className='flex flex-col gap-2 print:hidden'>
      <div className='grid grid-cols-2 gap-2'>
        <Button type='button' variant='outline' disabled={isPending} onClick={handleAddItems}>
          {isPending ? tCommon('loading') : t('addItems')}
        </Button>
        <Button
          type='button'
          variant='destructive'
          disabled={isPending}
          onClick={handleCancelPayment}
        >
          {isPending ? tCommon('loading') : t('cancelPayment')}
        </Button>
      </div>
      <SimulatePaymentButton orderId={order.id} />
    </div>
  )
}

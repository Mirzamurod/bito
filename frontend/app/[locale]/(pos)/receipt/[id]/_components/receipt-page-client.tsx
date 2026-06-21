'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrder } from '@/hooks/queries/use-order'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { Link } from '@/i18n/navigation'
import { useCartStore } from '@/lib/cart-store'
import { ApiError } from '@/types/api'

import { ReceiptView } from './receipt-view'
import { PendingReceiptActions } from './pending-receipt-actions'

type ReceiptPageClientProps = {
  orderId: string
}

export function ReceiptPageClient({ orderId }: ReceiptPageClientProps) {
  const t = useTranslations('receipt')
  const getErrorMessage = useApiErrorMessage()
  const clearCart = useCartStore(state => state.clearCart)

  const { data: order, isLoading, isError, error } = useOrder(orderId)

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-64' />
        <Skeleton className='h-40 w-full' />
      </div>
    )
  }

  if (isError) {
    const message =
      error instanceof ApiError ? getErrorMessage(error.code) : getErrorMessage('UNKNOWN_ERROR')

    return (
      <Card>
        <CardContent className='pt-6'>
          <p className='text-destructive text-sm'>{message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!order) {
    return null
  }

  if (order.receiptAvailable) {
    return (
      <div className='space-y-4'>
        <ReceiptView order={order} mode='paid' />
        <Button asChild className='w-full print:hidden'>
          <Link href='/pos' onClick={() => clearCart()}>
            {t('newSale')}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <ReceiptView order={order} mode='pending' />
      <PendingReceiptActions order={order} />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { queryKeys } from '@/lib/query-keys'

type SimulatePaymentButtonProps = {
  orderId: string
}

export function SimulatePaymentButton({ orderId }: SimulatePaymentButtonProps) {
  const t = useTranslations('receipt')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const [isPending, setIsPending] = useState(false)

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  async function handleSimulatePayment() {
    if (isPending) {
      return
    }

    setIsPending(true)

    try {
      const response = await fetch('/api/dev/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })

      if (!response.ok) {
        throw new Error('Simulate payment failed')
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) })
    } catch {
      toast.error(t('simulateError'))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button type='button' variant='secondary' disabled={isPending} onClick={handleSimulatePayment}>
      {isPending ? tCommon('loading') : t('simulatePayment')}
    </Button>
  )
}

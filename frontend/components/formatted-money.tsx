'use client'

import { useLocale } from 'next-intl'
import { useSyncExternalStore } from 'react'

import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

type FormattedMoneyProps = {
  amount: number
  className?: string
}

const emptySubscribe = () => () => {}

function useIsClient(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export function FormattedMoney({ amount, className }: FormattedMoneyProps) {
  const locale = useLocale()
  const isClient = useIsClient()

  return (
    <span className={cn(className)} suppressHydrationWarning>
      {isClient ? formatMoney(amount, locale) : '\u00a0'}
    </span>
  )
}

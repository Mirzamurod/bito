'use client'

import { useLocale, useTranslations } from 'next-intl'

import { FormattedMoney } from '@/components/formatted-money'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { OrderReceipt } from '@/types/order'

type ReceiptViewProps = {
  order: OrderReceipt
  mode?: 'pending' | 'paid'
}

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ReceiptView({ order, mode = 'paid' }: ReceiptViewProps) {
  const t = useTranslations('receipt')
  const locale = useLocale()

  const items = order.items ?? []
  const isPending = mode === 'pending'

  return (
    <Card className='print:border-0 print:shadow-none'>
      <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
        <div className='space-y-1'>
          <CardTitle>{isPending ? t('orderSummary') : t('title')}</CardTitle>
          <p className='text-muted-foreground text-sm'>
            {t('orderId')}: {order.id}
          </p>
          <p className='text-muted-foreground text-sm'>
            {t('createdAt')}: {formatDateTime(order.createdAt, locale)}
          </p>
        </div>
        <Badge variant={isPending ? 'secondary' : 'default'}>
          {isPending ? t('pending') : t('paid')}
        </Badge>
      </CardHeader>

      <CardContent className='space-y-4'>
        {isPending ? (
          <p className='text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm'>
            {order.message ?? t('pendingNote')}
          </p>
        ) : null}

        {items.length > 0 ? (
          <ul className='divide-y'>
            {items.map(item => (
              <li
                key={item.productId}
                className='flex items-start justify-between gap-4 py-3 first:pt-0'
              >
                <div className='min-w-0'>
                  <p className='font-medium'>{item.name}</p>
                  <p className='text-muted-foreground text-sm'>
                    {item.quantity} × <FormattedMoney amount={item.unitPrice} />
                  </p>
                </div>
                <p className='shrink-0 font-medium'>
                  <FormattedMoney amount={item.lineTotal} />
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-foreground text-sm'>{t('noItems')}</p>
        )}

        <div className='space-y-2 border-t pt-4'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>{t('subtotal')}</span>
            <span>
              <FormattedMoney amount={order.subtotal ?? 0} />
            </span>
          </div>
          <div className='flex items-center justify-between font-semibold'>
            <span>{t('total')}</span>
            <span>
              <FormattedMoney amount={order.total ?? 0} />
            </span>
          </div>
        </div>

        {!isPending && order.paidAt ? (
          <p className='text-muted-foreground text-sm'>
            {t('paidAt')}: {formatDateTime(order.paidAt, locale)}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className='hidden print:block'>
        <p className='text-muted-foreground text-xs'>{t('print')}</p>
      </CardFooter>
    </Card>
  )
}

'use client'

import { useTranslations } from 'next-intl'

import { FormattedMoney } from '@/components/formatted-money'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useCartStore } from '@/lib/cart-store'
import { cn } from '@/lib/utils'

import { CheckoutButton } from './checkout-button'

export function Cart() {
  const t = useTranslations('cart')
  const items = useCartStore(state => state.items)
  const stockErrorProductIds = useCartStore(state => state.stockErrorProductIds)
  const removeItem = useCartStore(state => state.removeItem)
  const incrementItem = useCartStore(state => state.incrementItem)
  const decrementItem = useCartStore(state => state.decrementItem)
  const getSubtotal = useCartStore(state => state.getSubtotal)

  const subtotal = getSubtotal()
  const isEmpty = items.length === 0

  return (
    <Card className='h-fit lg:sticky lg:top-4 max-lg:sticky max-lg:bottom-0 max-lg:z-10 max-lg:shadow-md'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        {isEmpty ? (
          <p className='text-muted-foreground text-sm'>{t('empty')}</p>
        ) : (
          <ul className='space-y-3'>
            {items.map(item => {
              const hasStockError = stockErrorProductIds.includes(item.productId)

              return (
                <li
                  key={item.productId}
                  className={cn(
                    'flex flex-col gap-2 rounded-md border-b pb-3 last:border-b-0 last:pb-0',
                    hasStockError && 'border-destructive/40 bg-destructive/5 px-2 py-2',
                  )}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <p className='truncate font-medium'>{item.displayName}</p>
                      <p className='text-muted-foreground text-sm'>
                        <FormattedMoney amount={item.displayPrice ?? 0} />
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground h-auto shrink-0 px-2 py-1'
                      onClick={() => removeItem(item.productId)}
                    >
                      {t('remove')}
                    </Button>
                  </div>

                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-muted-foreground text-xs'>{t('quantity')}</span>
                    <div className='flex items-center gap-1'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='h-8 w-8'
                        onClick={() => decrementItem(item.productId)}
                      >
                        −
                      </Button>
                      <span className='w-8 text-center text-sm'>{item.quantity}</span>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='h-8 w-8'
                        onClick={() => incrementItem(item.productId)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <CardFooter className='flex flex-col gap-3 border-t'>
        <div className='flex w-full items-center justify-between text-sm'>
          <span className='text-muted-foreground'>{t('subtotal')}</span>
          <span className='font-medium'>
            <FormattedMoney amount={subtotal} />
          </span>
        </div>
        <CheckoutButton />
      </CardFooter>
    </Card>
  )
}

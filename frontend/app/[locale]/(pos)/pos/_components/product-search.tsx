'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { FormattedMoney } from '@/components/formatted-money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { PRODUCTS_PAGE_LIMIT, useProducts } from '@/hooks/queries/use-products'
import { useCartStore } from '@/lib/cart-store'
import { cn } from '@/lib/utils'
import { ApiError } from '@/types/api'
import type { Product } from '@/types/product'

export function ProductSearch() {
  const t = useTranslations('pos')
  const getErrorMessage = useApiErrorMessage()
  const addItem = useCartStore(state => state.addItem)
  const cartItems = useCartStore(state => state.items)
  const stockErrorProductIds = useCartStore(state => state.stockErrorProductIds)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 500)

  const { data, isLoading, isFetching, isError, error } = useProducts({
    search: debouncedSearch,
    page,
    limit: PRODUCTS_PAGE_LIMIT,
  })

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    if (isError && error instanceof ApiError) {
      toast.error(getErrorMessage(error.code))
    }
  }, [isError, error, getErrorMessage])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const showSkeleton = isLoading && !data

  const cartQuantityByProductId = useMemo(
    () => new Map(cartItems.map(item => [item.productId, item.quantity])),
    [cartItems],
  )

  function handleAddToCart(product: Product) {
    addItem(product)
  }

  return (
    <div className='flex flex-col gap-4'>
      <Input
        type='search'
        value={search}
        onChange={event => setSearch(event.target.value)}
        placeholder={t('search.placeholder')}
        aria-label={t('search.placeholder')}
      />

      <div className='rounded-xl ring-1 ring-foreground/10'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead className='hidden sm:table-cell'>{t('table.sku')}</TableHead>
              <TableHead className='hidden md:table-cell'>{t('table.category')}</TableHead>
              <TableHead className='text-right'>{t('table.price')}</TableHead>
              <TableHead className='text-right'>{t('table.stock')}</TableHead>
              <TableHead className='text-right'>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeleton &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={6}>
                    <Skeleton className='h-8 w-full' />
                  </TableCell>
                </TableRow>
              ))}

            {!showSkeleton && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-muted-foreground h-24 text-center'>
                  {t('search.empty')}
                </TableCell>
              </TableRow>
            )}

            {!showSkeleton &&
              data?.items.map(product => {
                const cartQuantity = cartQuantityByProductId.get(product.id) ?? 0
                const isInCart = cartQuantity > 0
                const isAtMaxStock = cartQuantity >= product.stock
                const hasStockError = stockErrorProductIds.includes(product.id)

                return (
                <TableRow
                  key={product.id}
                  className={cn(
                    isInCart && !hasStockError && 'bg-muted/70 hover:bg-muted/70',
                    hasStockError && 'bg-destructive/10 hover:bg-destructive/10',
                  )}
                >
                  <TableCell className='font-medium'>{product.name}</TableCell>
                  <TableCell className='text-muted-foreground hidden sm:table-cell'>
                    {product.sku}
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {product.category?.name ?? '—'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <FormattedMoney amount={product.price} />
                  </TableCell>
                  <TableCell className='text-right'>{product.stock}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      disabled={product.stock < 1 || isAtMaxStock}
                      onClick={() => handleAddToCart(product)}
                    >
                      {t('addToCart')}
                    </Button>
                  </TableCell>
                </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>

      {data && data.total > 0 && (
        <div className='flex items-center justify-between gap-4'>
          <p className='text-muted-foreground text-sm'>
            {t('pagination.summary', {
              page: data.page,
              totalPages,
              total: data.total,
            })}
          </p>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={page <= 1 || isFetching}
              onClick={() => setPage(current => Math.max(1, current - 1))}
            >
              {t('pagination.previous')}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage(current => current + 1)}
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { FormattedMoney } from '@/components/formatted-money'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSalesReport } from '@/hooks/queries/use-sales-report'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { getDefaultReportDateRange, isValidReportDateRange } from '@/lib/report-dates'
import { ApiError } from '@/types/api'

import { DateRangePicker } from './date-range-picker'

export function SalesReport() {
  const t = useTranslations('report')
  const getErrorMessage = useApiErrorMessage()

  const defaultRange = useMemo(() => getDefaultReportDateRange(), [])

  const [from, setFrom] = useState(defaultRange.from)
  const [to, setTo] = useState(defaultRange.to)
  const [appliedRange, setAppliedRange] = useState(defaultRange)

  const showInvalidRange = !isValidReportDateRange(from, to)

  const { data, isLoading, isError, error, isFetching } = useSalesReport(appliedRange)

  function handleApply() {
    if (!isValidReportDateRange(from, to)) {
      return
    }

    setAppliedRange({ from, to })
  }

  function handleClear() {
    setFrom(defaultRange.from)
    setTo(defaultRange.to)
    setAppliedRange(defaultRange)
  }

  const canClear = from !== defaultRange.from || to !== defaultRange.to

  const isEmpty =
    data &&
    data.totalRevenue === 0 &&
    data.totalMargin === 0 &&
    data.topProducts.length === 0

  return (
    <div className='flex flex-col gap-6'>
      <DateRangePicker
        from={from}
        to={to}
        disabled={isFetching}
        showInvalidRange={showInvalidRange}
        showClear={canClear}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={handleApply}
        onClear={handleClear}
      />

      {isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2'>
          <Skeleton className='h-28 w-full' />
          <Skeleton className='h-28 w-full' />
          <Skeleton className='col-span-full h-48 w-full' />
        </div>
      ) : null}

      {isError ? (
        <Card>
          <CardContent className='pt-6'>
            <p className='text-destructive text-sm'>
              {error instanceof ApiError ? getErrorMessage(error.code) : getErrorMessage('UNKNOWN_ERROR')}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        <>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base font-medium'>{t('revenue')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-3xl font-semibold'>
                  <FormattedMoney amount={data.totalRevenue} />
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base font-medium'>{t('margin')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-3xl font-semibold'>
                  <FormattedMoney amount={data.totalMargin} />
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className='text-base font-medium'>{t('topProducts')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isEmpty ? (
                <p className='text-muted-foreground text-sm'>{t('empty')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('product')}</TableHead>
                      <TableHead className='text-right'>{t('quantity')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topProducts.map(product => (
                      <TableRow key={product.productId}>
                        <TableCell className='font-medium'>{product.name}</TableCell>
                        <TableCell className='text-right'>{product.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

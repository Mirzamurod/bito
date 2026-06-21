'use client'

import { CalendarIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useSyncExternalStore } from 'react'
import type { DateRange } from 'react-day-picker'
import { enUS } from 'react-day-picker/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  formatReportDateKey,
  formatReportDateLabel,
  parseReportDateKey,
} from '@/lib/report-dates'
import { cn } from '@/lib/utils'

type DateRangePickerProps = {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onApply: () => void
  disabled?: boolean
  showInvalidRange?: boolean
}

const emptySubscribe = () => () => {}

function useIsClient(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

function toSelectedRange(from: string, to: string): DateRange | undefined {
  if (!from) {
    return undefined
  }

  return {
    from: parseReportDateKey(from),
    to: to ? parseReportDateKey(to) : undefined,
  }
}

function DateRangeLabel({ from, to }: { from: string; to: string }) {
  const isClient = useIsClient()
  const t = useTranslations('report')

  if (!isClient) {
    return <span suppressHydrationWarning>{'\u00a0'}</span>
  }

  if (from && to) {
    return (
      <span>
        {formatReportDateLabel(from)} – {formatReportDateLabel(to)}
      </span>
    )
  }

  if (from) {
    return <span>{formatReportDateLabel(from)}</span>
  }

  return <span className='text-muted-foreground'>{t('pickDates')}</span>
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  disabled = false,
  showInvalidRange = false,
}: DateRangePickerProps) {
  const t = useTranslations('report')

  const selected = useMemo(() => toSelectedRange(from, to), [from, to])

  function handleRangeSelect(range: DateRange | undefined) {
    if (range?.from) {
      onFromChange(formatReportDateKey(range.from))
    }

    if (range?.to) {
      onToChange(formatReportDateKey(range.to))
    }
  }

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end'>
      <div className='flex flex-1 flex-col gap-1.5'>
        <span className='text-muted-foreground text-sm'>{t('dateRange')}</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='outline'
              disabled={disabled}
              className={cn(
                'w-full justify-start text-left font-normal sm:w-[min(100%,20rem)]',
                !from && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className='size-4' />
              <DateRangeLabel from={from} to={to} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-auto p-0'>
            <Calendar
              mode='range'
              locale={enUS}
              numberOfMonths={2}
              defaultMonth={selected?.from}
              selected={selected}
              disabled={disabled}
              onSelect={handleRangeSelect}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button type='button' disabled={disabled || showInvalidRange} onClick={onApply}>
        {t('apply')}
      </Button>

      {showInvalidRange ? (
        <p className='text-destructive w-full text-sm'>{t('invalidRange')}</p>
      ) : null}
    </div>
  )
}

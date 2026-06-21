'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { useApiClient } from '@/hooks/use-api-client'
import { isValidReportDateRange } from '@/lib/report-dates'
import { queryKeys } from '@/lib/query-keys'
import type { SalesReport, SalesReportDateRange } from '@/types/report'

export function useSalesReport({ from, to }: SalesReportDateRange) {
  const { status } = useSession()
  const api = useApiClient()

  const isEnabled =
    status === 'authenticated' &&
    Boolean(api.accessToken) &&
    isValidReportDateRange(from, to)

  return useQuery({
    queryKey: queryKeys.salesReport({ from, to }),
    queryFn: () => {
      const params = new URLSearchParams({ from, to })
      return api.get<SalesReport>(`/api/reports/sales?${params.toString()}`)
    },
    enabled: isEnabled,
  })
}

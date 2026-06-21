import { Types } from 'mongoose'

import type { SalesReportDto } from '../dto/reportDto'
import { AppError } from '../middleware/errorHandler'
import { Order } from '../models/Order'
import { getCachedReport, getReportCacheKey, setCachedReport } from './cacheService'

const REPORT_CACHE_TTL_MS = 5 * 60 * 1000

export interface SalesReportDateRange {
  from: Date
  to: Date
  fromKey: string
  toKey: string
}

function parseDateInput(value: string, boundary: 'start' | 'end'): Date {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'INVALID_DATE', `Invalid date: ${value}`)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (boundary === 'start') {
      date.setUTCHours(0, 0, 0, 0)
    } else {
      date.setUTCHours(23, 59, 59, 999)
    }
  }

  return date
}

export function parseSalesReportDateRange(fromRaw?: string, toRaw?: string): SalesReportDateRange {
  if (!fromRaw || !toRaw) {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'Both from and to are required')
  }

  const from = parseDateInput(fromRaw, 'start')
  const to = parseDateInput(toRaw, 'end')

  if (from > to) {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'from must be before to')
  }

  return {
    from,
    to,
    fromKey: fromRaw,
    toKey: toRaw,
  }
}

export async function getSalesReport(
  tenantId: string,
  range: SalesReportDateRange,
): Promise<SalesReportDto> {
  const cacheKey = getReportCacheKey(tenantId, range.fromKey, range.toKey)
  const cached = getCachedReport<SalesReportDto>(cacheKey)

  if (cached) {
    return cached
  }

  const tenantObjectId = new Types.ObjectId(tenantId)

  const [result] = await Order.aggregate<{
    topProducts: Array<{
      _id: Types.ObjectId
      name: string
      quantity: number
    }>
    totals: Array<{
      revenue: number
      margin: number
    }>
  }>([
    {
      $match: {
        tenantId: tenantObjectId,
        status: 'paid',
        paidAt: { $gte: range.from, $lte: range.to },
      },
    },
    {
      $facet: {
        topProducts: [
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productId',
              name: { $first: '$items.name' },
              quantity: { $sum: '$items.quantity' },
            },
          },
          { $sort: { quantity: -1 } },
          { $limit: 10 },
        ],
        totals: [
          { $unwind: '$items' },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$items.lineTotal' },
              margin: {
                $sum: {
                  $multiply: [
                    '$items.quantity',
                    { $subtract: ['$items.unitPrice', '$items.unitCostPrice'] },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ])

  const totals = result?.totals[0]

  const report: SalesReportDto = {
    from: range.fromKey,
    to: range.toKey,
    topProducts: (result?.topProducts ?? []).map(product => ({
      productId: product._id.toString(),
      name: product.name,
      quantity: product.quantity,
    })),
    totalRevenue: Number((totals?.revenue ?? 0).toFixed(2)),
    totalMargin: Number((totals?.margin ?? 0).toFixed(2)),
  }

  setCachedReport(cacheKey, report, REPORT_CACHE_TTL_MS)

  return report
}

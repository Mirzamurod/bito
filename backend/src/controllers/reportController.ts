import type { Request, Response } from 'express'

import { getSalesReport, parseSalesReportDateRange } from '../services/reportService'

export async function getSales(req: Request, res: Response): Promise<void> {
  const range = parseSalesReportDateRange(
    typeof req.query.from === 'string' ? req.query.from : undefined,
    typeof req.query.to === 'string' ? req.query.to : undefined,
  )

  const report = await getSalesReport(req.user!.tenantId, range)

  res.json({ data: report })
}

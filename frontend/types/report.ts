export interface SalesReportTopProduct {
  productId: string
  name: string
  quantity: number
}

export interface SalesReport {
  from: string
  to: string
  topProducts: SalesReportTopProduct[]
  totalRevenue: number
  totalMargin: number
}

export type SalesReportDateRange = {
  from: string
  to: string
}

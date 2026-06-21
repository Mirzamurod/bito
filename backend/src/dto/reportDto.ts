export interface SalesReportTopProduct {
  productId: string
  name: string
  quantity: number
}

export interface SalesReportDto {
  from: string
  to: string
  topProducts: SalesReportTopProduct[]
  totalRevenue: number
  totalMargin: number
}

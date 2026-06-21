export interface OrderItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  status: string
  items: OrderItem[]
  subtotal: number
  total: number
  createdAt: string
}

export type CreateOrderInput = {
  items: Array<{
    productId: string
    quantity: number
  }>
}

export interface OrderReceipt {
  id: string
  status: string
  createdAt: string
  receiptAvailable: boolean
  message?: string
  items?: OrderItem[]
  subtotal?: number
  total?: number
  paidAt?: string
}

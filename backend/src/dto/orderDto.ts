import type { UserRole } from '../models/User'

export interface OrderItemDto {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  unitCostPrice?: number
}

export interface OrderDto {
  id: string
  status: string
  items: OrderItemDto[]
  subtotal: number
  total: number
  createdAt: Date
}

export interface OrderReceiptDto {
  id: string
  status: string
  createdAt: Date
  receiptAvailable: boolean
  message?: string
  items?: OrderItemDto[]
  subtotal?: number
  total?: number
  paidAt?: Date
}

type OrderSource = {
  _id: { toString(): string }
  status: string
  items: Array<{
    productId: { toString(): string }
    name: string
    quantity: number
    unitPrice: number
    unitCostPrice: number
    lineTotal: number
  }>
  subtotal: number
  total: number
  createdAt: Date
  paidAt?: Date | null
}

export function toOrderDto(order: OrderSource, role: UserRole): OrderDto {
  return {
    id: order._id.toString(),
    status: order.status,
    items: mapOrderItems(order.items, role),
    subtotal: order.subtotal,
    total: order.total,
    createdAt: order.createdAt,
  }
}

function mapOrderItems(items: OrderSource['items'], role: UserRole): OrderItemDto[] {
  return items.map(item => {
    const dto: OrderItemDto = {
      productId: item.productId.toString(),
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }

    if (role === 'admin') {
      dto.unitCostPrice = item.unitCostPrice
    }

    return dto
  })
}

export function toOrderReceiptDto(order: OrderSource, role: UserRole): OrderReceiptDto {
  const base: OrderReceiptDto = {
    id: order._id.toString(),
    status: order.status,
    createdAt: order.createdAt,
    receiptAvailable: order.status === 'paid',
  }

  if (order.status === 'pending_payment') {
    return {
      ...base,
      items: mapOrderItems(order.items, role),
      subtotal: order.subtotal,
      total: order.total,
      message: 'Payment pending',
    }
  }

  if (order.status !== 'paid') {
    return {
      ...base,
      message: 'Receipt not available',
    }
  }

  return {
    ...base,
    items: mapOrderItems(order.items, role),
    subtotal: order.subtotal,
    total: order.total,
    paidAt: order.paidAt ?? undefined,
  }
}

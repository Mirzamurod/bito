import { Types, type ClientSession } from 'mongoose'

import { AppError } from '../middleware/errorHandler'
import { Order, type OrderDocument } from '../models/Order'
import { Product } from '../models/Product'
import { isTransactionNotSupported, runInTransaction } from '../utils/transaction'

export interface CreateOrderItemInput {
  productId: string
  quantity: number
}

export interface CreateOrderInput {
  tenantId: string
  cashierId: string
  items: CreateOrderItemInput[]
}

interface StockRollback {
  productId: Types.ObjectId
  quantity: number
}

interface PreparedOrderItem {
  productId: Types.ObjectId
  name: string
  quantity: number
  unitPrice: number
  unitCostPrice: number
  lineTotal: number
}

function normalizeItems(items: CreateOrderItemInput[]): Map<string, number> {
  const merged = new Map<string, number>()

  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity)
  }

  return merged
}

async function restoreStock(
  tenantId: Types.ObjectId,
  rollbacks: StockRollback[],
  session?: ClientSession,
): Promise<void> {
  for (const rollback of rollbacks) {
    await Product.updateOne(
      { _id: rollback.productId, tenantId },
      { $inc: { stock: rollback.quantity } },
      { session },
    )
  }
}

async function createOrderInternal(
  input: CreateOrderInput,
  session?: ClientSession,
): Promise<OrderDocument> {
  const tenantObjectId = new Types.ObjectId(input.tenantId)
  const cashierObjectId = new Types.ObjectId(input.cashierId)
  const mergedItems = normalizeItems(input.items)
  const productIds = [...mergedItems.keys()].sort()

  const orderItems: PreparedOrderItem[] = []
  const rollbacks: StockRollback[] = []

  try {
    for (const productId of productIds) {
      const quantity = mergedItems.get(productId)!
      const productObjectId = new Types.ObjectId(productId)

      const product = await Product.findOneAndUpdate(
        {
          _id: productObjectId,
          tenantId: tenantObjectId,
          stock: { $gte: quantity },
        },
        {
          $inc: { stock: -quantity, version: 1 },
        },
        { new: true, session },
      )

      if (!product) {
        const existingQuery = Product.findOne({
          _id: productObjectId,
          tenantId: tenantObjectId,
        }).select('name stock')

        const existing = await (session
          ? existingQuery.session(session).lean()
          : existingQuery.lean())

        if (!existing) {
          throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found', {
            productId,
          })
        }

        throw new AppError(409, 'INSUFFICIENT_STOCK', `Not enough stock for ${existing.name}`, {
          productId,
          name: existing.name,
          requested: quantity,
          available: existing.stock,
        })
      }

      rollbacks.push({ productId: productObjectId, quantity })

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity,
        unitPrice: product.price,
        unitCostPrice: product.costPrice,
        lineTotal: Number((product.price * quantity).toFixed(2)),
      })
    }

    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2))

    const [order] = await Order.create(
      [
        {
          tenantId: tenantObjectId,
          cashierId: cashierObjectId,
          status: 'pending_payment',
          items: orderItems,
          subtotal,
          total: subtotal,
        },
      ],
      { session },
    )

    return order
  } catch (error) {
    if (!session && rollbacks.length > 0) {
      await restoreStock(tenantObjectId, rollbacks)
    }

    throw error
  }
}

export async function createOrder(input: CreateOrderInput): Promise<OrderDocument> {
  try {
    return await runInTransaction(session => createOrderInternal(input, session))
  } catch (error) {
    if (isTransactionNotSupported(error)) {
      return createOrderInternal(input)
    }

    throw error
  }
}

export function validateCreateOrderItems(raw: unknown): CreateOrderItemInput[] {
  if (!raw || typeof raw !== 'object' || !('items' in raw)) {
    throw new AppError(400, 'INVALID_CART', 'Cart items are required')
  }

  const { items } = raw as { items?: unknown }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'INVALID_CART', 'Cart must contain at least one item')
  }

  const parsed: CreateOrderItemInput[] = []

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      throw new AppError(400, 'INVALID_CART', 'Each cart item must be an object')
    }

    const { productId, quantity } = item as {
      productId?: unknown
      quantity?: unknown
    }

    if (typeof productId !== 'string' || !Types.ObjectId.isValid(productId)) {
      throw new AppError(400, 'INVALID_CART', 'Each item must have a valid productId')
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
      throw new AppError(400, 'INVALID_CART', 'Each item must have quantity >= 1')
    }

    parsed.push({ productId, quantity })
  }

  return parsed
}

export async function getOrderById(orderId: string, tenantId: string): Promise<OrderDocument> {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new AppError(400, 'INVALID_ORDER_ID', 'Invalid order id')
  }

  const order = await Order.findOne({
    _id: new Types.ObjectId(orderId),
    tenantId: new Types.ObjectId(tenantId),
  })

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found')
  }

  return order
}

async function cancelOrderInternal(
  orderId: string,
  tenantId: string,
  session?: ClientSession,
): Promise<OrderDocument> {
  const tenantObjectId = new Types.ObjectId(tenantId)
  const orderObjectId = new Types.ObjectId(orderId)

  const orderQuery = Order.findOne({
    _id: orderObjectId,
    tenantId: tenantObjectId,
  })

  const order = await (session ? orderQuery.session(session) : orderQuery)

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found')
  }

  if (order.status === 'cancelled') {
    return order
  }

  if (order.status !== 'pending_payment') {
    throw new AppError(
      409,
      'INVALID_ORDER_STATE',
      `Order cannot be cancelled from status ${order.status}`,
    )
  }

  const rollbacks: StockRollback[] = order.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
  }))

  await restoreStock(tenantObjectId, rollbacks, session)

  order.status = 'cancelled'
  await order.save(session ? { session } : undefined)

  return order
}

export async function cancelOrder(orderId: string, tenantId: string): Promise<OrderDocument> {
  try {
    return await runInTransaction(session => cancelOrderInternal(orderId, tenantId, session))
  } catch (error) {
    if (isTransactionNotSupported(error)) {
      return cancelOrderInternal(orderId, tenantId)
    }

    throw error
  }
}

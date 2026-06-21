import { Types } from 'mongoose'

import { AppError } from '../middleware/errorHandler'
import { Order } from '../models/Order'
import { PaymentEvent } from '../models/PaymentEvent'
import { invalidateTenantReportCache } from './cacheService'
import { isTransactionNotSupported, runInTransaction } from '../utils/transaction'

export interface PaymentWebhookPayload {
  eventId: string
  orderId: string
  tenantId: string
  status: 'paid'
}

export interface PaymentWebhookResult {
  orderId: string
  status: 'paid'
  duplicate: boolean
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  )
}

export function parsePaymentWebhookPayload(raw: unknown): PaymentWebhookPayload {
  if (!raw || typeof raw !== 'object') {
    throw new AppError(400, 'INVALID_PAYLOAD', 'Webhook payload must be an object')
  }

  const { eventId, orderId, tenantId, status } = raw as Record<string, unknown>

  if (typeof eventId !== 'string' || !eventId.trim()) {
    throw new AppError(400, 'INVALID_PAYLOAD', 'eventId is required')
  }

  if (typeof orderId !== 'string' || !Types.ObjectId.isValid(orderId)) {
    throw new AppError(400, 'INVALID_PAYLOAD', 'orderId must be a valid id')
  }

  if (typeof tenantId !== 'string' || !Types.ObjectId.isValid(tenantId)) {
    throw new AppError(400, 'INVALID_PAYLOAD', 'tenantId must be a valid id')
  }

  if (status !== 'paid') {
    throw new AppError(400, 'INVALID_STATUS', 'Only paid status is supported')
  }

  return {
    eventId: eventId.trim(),
    orderId,
    tenantId,
    status,
  }
}

async function markOrderPaid(
  payload: PaymentWebhookPayload,
  rawPayload: unknown,
): Promise<PaymentWebhookResult> {
  const orderObjectId = new Types.ObjectId(payload.orderId)
  const tenantObjectId = new Types.ObjectId(payload.tenantId)

  const order = await Order.findById(orderObjectId)

  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found')
  }

  if (!order.tenantId.equals(tenantObjectId)) {
    throw new AppError(403, 'FORBIDDEN', 'Order does not belong to tenant')
  }

  if (order.status === 'paid') {
    try {
      await PaymentEvent.create({
        eventId: payload.eventId,
        tenantId: order.tenantId,
        orderId: order._id,
        payload: rawPayload,
      })
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error
      }
    }

    return {
      orderId: order._id.toString(),
      status: 'paid',
      duplicate: true,
    }
  }

  if (order.status !== 'pending_payment') {
    throw new AppError(
      409,
      'INVALID_ORDER_STATE',
      `Order cannot be paid from status ${order.status}`,
    )
  }

  const applyPayment = async (session?: import('mongoose').ClientSession) => {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderObjectId, tenantId: tenantObjectId, status: 'pending_payment' },
      { status: 'paid', paidAt: new Date() },
      { new: true, session },
    )

    if (!updatedOrder) {
      const latestQuery = Order.findById(orderObjectId)
      const latest = await (session ? latestQuery.session(session) : latestQuery)

      if (latest?.status === 'paid') {
        return latest
      }

      throw new AppError(409, 'INVALID_ORDER_STATE', 'Order is no longer awaiting payment')
    }

    await PaymentEvent.create(
      [
        {
          eventId: payload.eventId,
          tenantId: updatedOrder.tenantId,
          orderId: updatedOrder._id,
          payload: rawPayload,
        },
      ],
      { session },
    )

    return updatedOrder
  }

  try {
    try {
      await runInTransaction(session => applyPayment(session))
    } catch (error) {
      if (isTransactionNotSupported(error)) {
        await applyPayment()
      } else {
        throw error
      }
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        orderId: payload.orderId,
        status: 'paid',
        duplicate: true,
      }
    }

    throw error
  }

  invalidateTenantReportCache(payload.tenantId)

  return {
    orderId: payload.orderId,
    status: 'paid',
    duplicate: false,
  }
}

export async function processPaymentWebhook(
  payload: PaymentWebhookPayload,
  rawPayload: unknown,
): Promise<PaymentWebhookResult> {
  const existingEvent = await PaymentEvent.findOne({ eventId: payload.eventId }).lean()

  if (existingEvent) {
    return {
      orderId: existingEvent.orderId.toString(),
      status: 'paid',
      duplicate: true,
    }
  }

  return markOrderPaid(payload, rawPayload)
}

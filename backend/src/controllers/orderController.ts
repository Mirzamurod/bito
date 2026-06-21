import type { Request, Response } from 'express'

import { toOrderDto, toOrderReceiptDto } from '../dto/orderDto'
import { AppError } from '../middleware/errorHandler'
import {
  cancelOrder,
  createOrder,
  getOrderById,
  validateCreateOrderItems,
} from '../services/orderService'

export async function create(req: Request, res: Response): Promise<void> {
  const items = validateCreateOrderItems(req.body)

  const order = await createOrder({
    tenantId: req.user!.tenantId,
    cashierId: req.user!.userId,
    items,
  })

  res.status(201).json({
    data: toOrderDto(order, req.user!.role),
  })
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  if (typeof id !== 'string') {
    throw new AppError(400, 'INVALID_ORDER_ID', 'Invalid order id')
  }

  const order = await getOrderById(id, req.user!.tenantId)

  res.json({
    data: toOrderReceiptDto(order, req.user!.role),
  })
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  if (typeof id !== 'string') {
    throw new AppError(400, 'INVALID_ORDER_ID', 'Invalid order id')
  }

  const order = await cancelOrder(id, req.user!.tenantId)

  res.json({
    data: toOrderDto(order, req.user!.role),
  })
}

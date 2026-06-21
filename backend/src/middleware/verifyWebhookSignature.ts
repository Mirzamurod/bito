import type { NextFunction, Request, Response } from 'express'

import { env } from '../config/env'
import { AppError } from './errorHandler'
import { verifyHmacSha256 } from '../utils/hmac'

export function verifyWebhookSignature(req: Request, _res: Response, next: NextFunction): void {
  const signature = req.headers['x-signature']

  if (typeof signature !== 'string' || !signature.trim()) {
    next(new AppError(401, 'UNAUTHORIZED', 'Missing webhook signature'))
    return
  }

  if (!Buffer.isBuffer(req.body)) {
    next(new AppError(400, 'INVALID_PAYLOAD', 'Expected raw JSON body'))
    return
  }

  const isValid = verifyHmacSha256(req.body, signature.trim(), env.PAYMENT_WEBHOOK_SECRET)

  if (!isValid) {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid webhook signature'))
    return
  }

  next()
}

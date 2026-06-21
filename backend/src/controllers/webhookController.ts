import type { Request, Response } from 'express'

import {
  parsePaymentWebhookPayload,
  processPaymentWebhook,
} from '../services/paymentWebhookService'

export async function handlePayment(req: Request, res: Response): Promise<void> {
  const rawBody = req.body as Buffer
  const parsed = JSON.parse(rawBody.toString('utf8')) as unknown
  const payload = parsePaymentWebhookPayload(parsed)

  const result = await processPaymentWebhook(payload, parsed)

  res.status(200).json({ data: result })
}

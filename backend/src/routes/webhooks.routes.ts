import { Router } from 'express'

import { webhookController } from '../controllers'
import { asyncHandler } from '../middleware/asyncHandler'
import { verifyWebhookSignature } from '../middleware/verifyWebhookSignature'

const router = Router()

router.post('/payment', verifyWebhookSignature, asyncHandler(webhookController.handlePayment))

export const webhooksRouter = router

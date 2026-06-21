import { Router } from 'express'

import { orderController } from '../controllers'
import { asyncHandler } from '../middleware/asyncHandler'
import { authenticate } from '../middleware/auth'
import { requireTenant } from '../middleware/tenant'

const router = Router()

router.post('/:id/cancel', authenticate, requireTenant, asyncHandler(orderController.cancel))

router.get('/:id', authenticate, requireTenant, asyncHandler(orderController.getById))

router.post('/', authenticate, requireTenant, asyncHandler(orderController.create))

export const ordersRouter = router

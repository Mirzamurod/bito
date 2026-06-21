import { Router } from 'express'

import { productController } from '../controllers'
import { asyncHandler } from '../middleware/asyncHandler'
import { authenticate } from '../middleware/auth'
import { requireTenant } from '../middleware/tenant'

const router = Router()

router.get('/', authenticate, requireTenant, asyncHandler(productController.list))

export const productsRouter = router

import { Router } from 'express'

import { reportController } from '../controllers'
import { asyncHandler } from '../middleware/asyncHandler'
import { authenticate } from '../middleware/auth'
import { roleGuard } from '../middleware/roleGuard'
import { requireTenant } from '../middleware/tenant'

const router = Router()

router.get(
  '/sales',
  authenticate,
  requireTenant,
  roleGuard('admin'),
  asyncHandler(reportController.getSales),
)

export const reportsRouter = router

import { Router } from 'express'

import { authRouter } from './auth.routes'
import { ordersRouter } from './orders.routes'
import { productsRouter } from './products.routes'
import { reportsRouter } from './reports.routes'

const router = Router()

router.use(authRouter)
router.use('/products', productsRouter)
router.use('/orders', ordersRouter)
router.use('/reports', reportsRouter)

export const apiRouter = router

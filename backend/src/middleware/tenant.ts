import type { NextFunction, Request, Response } from 'express'

import { Tenant } from '../models/Tenant'
import { AppError } from './errorHandler'

export async function requireTenant(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const tenant = await Tenant.findById(req.user.tenantId).select('_id').lean()

    if (!tenant) {
      throw new AppError(403, 'TENANT_INVALID', 'Tenant not found or no longer active')
    }

    next()
  } catch (error) {
    next(error)
  }
}

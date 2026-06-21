import type { NextFunction, Request, Response } from 'express'

import type { UserRole } from '../models/User'
import { AppError } from './errorHandler'

export function roleGuard(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'))
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'))
      return
    }

    next()
  }
}

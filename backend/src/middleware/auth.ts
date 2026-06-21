import type { NextFunction, Request, Response } from 'express'

import { verifyAccessToken } from '../services/authService'
import { AppError } from './errorHandler'

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization

    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header')
    }

    const token = header.slice('Bearer '.length).trim()

    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header')
    }

    req.user = verifyAccessToken(token)
    next()
  } catch (error) {
    next(error)
  }
}

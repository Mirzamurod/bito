import jwt from 'jsonwebtoken'

import { env } from '../config/env'
import { AppError } from '../middleware/errorHandler'
import { USER_ROLES } from '../models/User'
import type { AccessTokenPayload, AuthUser } from '../types/auth'

function parsePayload(decoded: jwt.JwtPayload): AccessTokenPayload {
  const { sub, tenantId, role } = decoded

  if (!sub || typeof sub !== 'string') {
    throw new AppError(401, 'UNAUTHORIZED', 'Token missing subject')
  }

  if (!tenantId || typeof tenantId !== 'string') {
    throw new AppError(403, 'TENANT_INVALID', 'Token missing tenant')
  }

  if (
    !role ||
    typeof role !== 'string' ||
    !USER_ROLES.includes(role as AccessTokenPayload['role'])
  ) {
    throw new AppError(401, 'UNAUTHORIZED', 'Token missing or invalid role')
  }

  return { sub, tenantId, role: role as AccessTokenPayload['role'] }
}

export function toAuthUser(payload: AccessTokenPayload): AuthUser {
  return {
    userId: payload.sub,
    tenantId: payload.tenantId,
    role: payload.role,
  }
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): AuthUser {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)

    if (typeof decoded !== 'object' || decoded === null) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token')
    }

    return toAuthUser(parsePayload(decoded))
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token')
    }

    throw error
  }
}

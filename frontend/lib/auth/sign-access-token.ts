import jwt from 'jsonwebtoken'

import type { UserRole } from '@/types/api'

export type AccessTokenPayload = {
  sub: string
  tenantId: string
  role: UserRole
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }

  return secret
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as jwt.SignOptions['expiresIn'],
  })
}

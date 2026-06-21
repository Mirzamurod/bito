import bcrypt from 'bcryptjs'

import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import type { UserRole } from '@/types/api'

export type AuthenticatedUser = {
  id: string
  email: string
  tenantId: string
  role: UserRole
}

export async function validateCredentials(
  email: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  await connectDB()

  const user = await User.findOne({ email: email.toLowerCase().trim() }).lean()

  if (!user) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)

  if (!isValid) {
    return null
  }

  return {
    id: user._id.toString(),
    email: user.email,
    tenantId: user.tenantId.toString(),
    role: user.role as UserRole,
  }
}

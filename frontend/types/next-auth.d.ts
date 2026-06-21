import type { DefaultSession } from 'next-auth'

import type { UserRole } from '@/types/api'

declare module 'next-auth' {
  interface User {
    tenantId: string
    role: UserRole
  }

  interface Session {
    accessToken?: string
    user: {
      id: string
      tenantId: string
      role: UserRole
    } & DefaultSession['user']
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    tenantId?: string
    role?: UserRole
    accessToken?: string
  }
}

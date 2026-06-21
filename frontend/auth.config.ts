import type { NextAuthConfig } from 'next-auth'

import type { UserRole } from '@/types/api'

/**
 * Edge-safe auth config — middleware uchun.
 * MongoDB / jsonwebtoken shu faylda import qilinmaydi.
 */
export const authConfig = {
  providers: [],
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const authenticatedUser = user as {
          id: string
          email: string
          tenantId: string
          role: UserRole
          accessToken?: string
        }

        token.sub = authenticatedUser.id
        token.email = authenticatedUser.email
        token.tenantId = authenticatedUser.tenantId
        token.role = authenticatedUser.role

        if (authenticatedUser.accessToken) {
          token.accessToken = authenticatedUser.accessToken
        }
      }

      return token
    },
    session({ session, token }) {
      if (token.sub && token.tenantId && token.role) {
        session.user = {
          ...session.user,
          id: token.sub,
          email: token.email ?? session.user.email,
          tenantId: token.tenantId,
          role: token.role,
        }
        session.accessToken = token.accessToken
      }

      return session
    },
  },
} satisfies NextAuthConfig

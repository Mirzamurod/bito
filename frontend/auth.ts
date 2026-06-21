import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import { authConfig } from '@/auth.config'
import { signAccessToken } from '@/lib/auth/sign-access-token'
import { validateCredentials } from '@/lib/auth/validate-credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password

        if (typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        const user = await validateCredentials(email, password)

        if (!user) {
          return null
        }

        return {
          ...user,
          accessToken: signAccessToken({
            sub: user.id,
            tenantId: user.tenantId,
            role: user.role,
          }),
        }
      },
    }),
  ],
})

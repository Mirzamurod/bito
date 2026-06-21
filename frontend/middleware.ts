import NextAuth from 'next-auth'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'

import { authConfig } from '@/auth.config'
import { getPostLoginPath } from '@/lib/auth/post-login-path'
import { routing } from '@/i18n/routing'
import {
  getPathnameWithoutLocale,
  isAdminPath,
  isAuthRequiredPath,
  isHomePath,
  isLoginPath,
} from '@/lib/auth/routes'

const intlMiddleware = createIntlMiddleware(routing)
const { auth } = NextAuth(authConfig)

export default auth(req => {
  const { pathname } = req.nextUrl
  const { locale, pathname: path } = getPathnameWithoutLocale(pathname)
  const session = req.auth
  const isLoggedIn = Boolean(session?.user)

  if (isAuthRequiredPath(path)) {
    if (!isLoggedIn) {
      const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAdminPath(path) && session?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL(`/${locale}/pos`, req.nextUrl.origin))
    }
  }

  if (isLoginPath(path) && isLoggedIn) {
    const target = getPostLoginPath(session?.user?.role)
    return NextResponse.redirect(new URL(`/${locale}${target}`, req.nextUrl.origin))
  }

  if (isHomePath(path)) {
    const target = isLoggedIn ? getPostLoginPath(session?.user?.role).slice(1) : 'login'
    return NextResponse.redirect(new URL(`/${locale}/${target}`, req.nextUrl.origin))
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: ['/', '/(en|uz)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}

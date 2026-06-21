import { routing, type Locale } from '@/i18n/routing'

export function getPathnameWithoutLocale(pathname: string): {
  locale: Locale
  pathname: string
} {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]

  if (first && routing.locales.includes(first as Locale)) {
    const rest = segments.slice(1).join('/')
    return {
      locale: first as Locale,
      pathname: rest ? `/${rest}` : '/',
    }
  }

  return {
    locale: routing.defaultLocale,
    pathname: pathname || '/',
  }
}

export function isLoginPath(pathname: string): boolean {
  return pathname === '/login'
}

export function isAuthRequiredPath(pathname: string): boolean {
  return pathname === '/pos' || pathname.startsWith('/receipt/') || isAdminPath(pathname)
}

export function isAdminPath(pathname: string): boolean {
  return pathname === '/reports' || pathname.startsWith('/reports/')
}

export function isHomePath(pathname: string): boolean {
  return pathname === '/'
}

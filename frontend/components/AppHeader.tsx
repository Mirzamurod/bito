'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { AuthControls } from '@/components/AuthControls'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { getPostLoginPath } from '@/lib/auth/post-login-path'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

function NavLink({
  href,
  active,
  children,
}: {
  href: '/pos' | '/reports'
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      asChild
      size='sm'
      variant={active ? 'default' : 'ghost'}
      className={cn(!active && 'text-muted-foreground')}
    >
      <Link href={href}>{children}</Link>
    </Button>
  )
}

export function AppHeader() {
  const { data: session } = useSession()
  const t = useTranslations('common')
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isAdmin = session?.user?.role === 'admin'
  const homeHref = getPostLoginPath(session?.user?.role)

  const isPosActive = pathname === '/pos' || pathname.startsWith('/receipt/')
  const isReportsActive = pathname === '/reports' || pathname.startsWith('/reports/')

  return (
    <header className='bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-50 border-b backdrop-blur'>
      <div className='mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6'>
        {!isLoginPage ? (
          <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
            <Link className='truncate font-semibold tracking-tight' href={homeHref}>
              {t('appName')}
            </Link>

            <nav
              aria-label='Main'
              className='bg-muted/60 flex items-center gap-0.5 rounded-lg p-0.5'
            >
              {isAdmin ? (
                <NavLink active={isReportsActive} href='/reports'>
                  {t('reports')}
                </NavLink>
              ) : null}
              <NavLink active={isPosActive} href='/pos'>
                {t('pos')}
              </NavLink>
            </nav>
          </div>
        ) : (
          <Link className='font-semibold tracking-tight' href='/login'>
            {t('appName')}
          </Link>
        )}

        <div className='ml-auto flex items-center gap-2 sm:gap-3'>
          <LanguageSwitcher />
          {!isLoginPage && session?.user ? (
            <div className='bg-border hidden h-6 w-px sm:block' aria-hidden />
          ) : null}
          <AuthControls />
        </div>
      </div>
    </header>
  )
}

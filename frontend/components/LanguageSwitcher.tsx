'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  uz: 'UZ',
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) return

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return (
    <div className={cn('flex items-center gap-1', className)} role='group' aria-label='Language'>
      {routing.locales.map(nextLocale => (
        <Button
          key={nextLocale}
          type='button'
          size='sm'
          variant={locale === nextLocale ? 'default' : 'outline'}
          disabled={isPending}
          onClick={() => switchLocale(nextLocale)}
          aria-pressed={locale === nextLocale}
        >
          {localeLabels[nextLocale]}
        </Button>
      ))}
    </div>
  )
}

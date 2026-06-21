'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors.page')
  const tCommon = useTranslations('common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className='mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
      <h1 className='text-2xl font-semibold'>{t('title')}</h1>
      <p className='text-muted-foreground text-sm'>{t('description')}</p>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        <Button type='button' onClick={reset}>
          {tCommon('tryAgain')}
        </Button>
        <Button asChild variant='outline'>
          <Link href='/pos'>{t('backToPos')}</Link>
        </Button>
      </div>
    </main>
  )
}

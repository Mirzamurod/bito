import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

export default async function NotFoundPage() {
  const t = await getTranslations('notFound')

  return (
    <main className='mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
      <h1 className='text-2xl font-semibold'>{t('title')}</h1>
      <p className='text-muted-foreground text-sm'>{t('description')}</p>
      <Link
        className='text-primary text-sm font-medium underline-offset-4 hover:underline'
        href='/pos'
      >
        {t('backToPos')}
      </Link>
    </main>
  )
}

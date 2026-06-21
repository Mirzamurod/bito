import { getTranslations } from 'next-intl/server'

import { PosShell } from './_components/pos-shell'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pos' })

  return { title: t('title') }
}

export default async function PosPage() {
  const t = await getTranslations('pos')

  return (
    <main className='mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8'>
      <h1 className='text-2xl font-semibold'>{t('title')}</h1>
      <PosShell />
    </main>
  )
}

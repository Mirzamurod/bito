import { getTranslations } from 'next-intl/server'

import { auth } from '@/auth'
import { redirect } from '@/i18n/navigation'

import { SalesReport } from './_components/sales-report'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'report' })

  return { title: t('title') }
}

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  const t = await getTranslations('report')

  if (!session?.user) {
    redirect({ href: '/login', locale })
  }

  const user = session!.user

  if (user.role !== 'admin') {
    redirect({ href: '/pos', locale })
  }

  return (
    <main className='mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold'>{t('title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('dateRange')}</p>
      </div>
      <SalesReport />
    </main>
  )
}

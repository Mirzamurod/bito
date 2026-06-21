import { getTranslations } from 'next-intl/server'

import { ReceiptPageClient } from './_components/receipt-page-client'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'receipt' })

  return { title: t('title') }
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <main className='mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-8'>
      <ReceiptPageClient orderId={id} />
    </main>
  )
}

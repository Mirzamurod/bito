import { getTranslations } from 'next-intl/server'

import { auth } from '@/auth'
import { getPostLoginPath } from '@/lib/auth/post-login-path'
import { redirect } from '@/i18n/navigation'

import { LoginForm } from './_components/login-form'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })

  return { title: t('title') }
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()
  const t = await getTranslations('auth.login')

  if (session?.user) {
    redirect({ href: getPostLoginPath(session.user.role), locale })
  }

  return (
    <main className='mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-8'>
      <div className='space-y-2'>
        <h1 className='text-2xl font-semibold'>{t('title')}</h1>
      </div>
      <LoginForm />
    </main>
  )
}

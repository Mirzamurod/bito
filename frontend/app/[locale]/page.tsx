import { auth } from '@/auth'
import { getPostLoginPath } from '@/lib/auth/post-login-path'
import { redirect } from '@/i18n/navigation'

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()

  redirect({ href: session?.user ? getPostLoginPath(session.user.role) : '/login', locale })
}

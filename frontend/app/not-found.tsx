import Link from 'next/link'

import { routing } from '@/i18n/routing'

export default function RootNotFound() {
  return (
    <main className='mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
      <h1 className='text-2xl font-semibold'>Page not found</h1>
      <p className='text-muted-foreground text-sm'>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        className='text-primary text-sm font-medium underline-offset-4 hover:underline'
        href={`/${routing.defaultLocale}/pos`}
      >
        Back to POS
      </Link>
    </main>
  )
}

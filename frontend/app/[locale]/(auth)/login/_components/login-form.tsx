'use client'

import { useQueryClient } from '@tanstack/react-query'
import { getSession, signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPostLoginPath } from '@/lib/auth/post-login-path'
import { useRouter } from '@/i18n/navigation'
import { resetAppState } from '@/lib/reset-app-state'

export function LoginForm() {
  const t = useTranslations('auth.login')
  const tErrors = useTranslations('auth.errors')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(tErrors('invalidCredentials'))
        return
      }

      resetAppState(queryClient)

      const session = await getSession()
      router.push(getPostLoginPath(session?.user?.role))
      router.refresh()
    } catch {
      toast.error(tErrors('invalidCredentials'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className='flex w-full flex-col gap-4' onSubmit={handleSubmit}>
      <div className='space-y-2'>
        <label className='text-sm font-medium' htmlFor='email'>
          {t('email')}
        </label>
        <Input
          id='email'
          type='email'
          autoComplete='email'
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
        />
      </div>

      <div className='space-y-2'>
        <label className='text-sm font-medium' htmlFor='password'>
          {t('password')}
        </label>
        <Input
          id='password'
          type='password'
          autoComplete='current-password'
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
        />
      </div>

      <Button className='w-full' type='submit' disabled={isSubmitting}>
        {isSubmitting ? tCommon('loading') : t('submit')}
      </Button>
    </form>
  )
}

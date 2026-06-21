'use client'

import { useTranslations } from 'next-intl'

import { getErrorMessageKey } from '@/lib/error-messages'

export function useApiErrorMessage() {
  const t = useTranslations('errors')

  return (code: string) => t(getErrorMessageKey(code))
}

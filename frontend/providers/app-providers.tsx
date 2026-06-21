'use client'

import { Toaster } from '@/components/ui/sonner'
import type { ReactNode } from 'react'

import { QueryProvider } from './query-provider'
import { SessionProvider } from './session-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </QueryProvider>
    </SessionProvider>
  )
}

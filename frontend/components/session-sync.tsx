'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'

import { resetAppState } from '@/lib/reset-app-state'

export function SessionSync() {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const previousUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    const userId = session?.user?.id ?? null

    if (previousUserIdRef.current !== null && previousUserIdRef.current !== userId) {
      resetAppState(queryClient)
    }

    previousUserIdRef.current = userId
  }, [queryClient, session?.user?.id, status])

  return null
}

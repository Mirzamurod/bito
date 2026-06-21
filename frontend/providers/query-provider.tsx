'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { signOut } from 'next-auth/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useRouter } from '@/i18n/navigation'
import { resetAppState } from '@/lib/reset-app-state'
import { ApiError } from '@/types/api'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status === 401) {
            return false
          }

          return failureCount < 1
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function QueryProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter()
  const getErrorMessage = useApiErrorMessage()
  const handlerRef = useRef<(error: ApiError) => void>(() => {})
  const [queryClient] = useState(createQueryClient)

  handlerRef.current = (error: ApiError) => {
    if (error.status === 401) {
      resetAppState(queryClient)
      void signOut({ redirect: false }).then(() => {
        toast.error(getErrorMessage('UNAUTHORIZED'))
        router.push('/login')
        router.refresh()
      })
      return
    }

    if (error.status === 403) {
      toast.error(getErrorMessage(error.code))
    }
  }

  useEffect(() => {
    const handleCacheError = (error: unknown) => {
      if (error instanceof ApiError) {
        handlerRef.current(error)
      }
    }

    const unsubscribeQuery = queryClient.getQueryCache().subscribe(event => {
      if (event.type !== 'updated' || event.action.type !== 'error') {
        return
      }

      handleCacheError(event.query.state.error)
    })

    const unsubscribeMutation = queryClient.getMutationCache().subscribe(event => {
      if (event.type !== 'updated' || event.action.type !== 'error') {
        return
      }

      handleCacheError(event.mutation.state.error)
    })

    return () => {
      unsubscribeQuery()
      unsubscribeMutation()
    }
  }, [queryClient])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryProviderInner>{children}</QueryProviderInner>
}

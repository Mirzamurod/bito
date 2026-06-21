'use client'

import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from '@/i18n/navigation'
import { resetAppState } from '@/lib/reset-app-state'
import { cn } from '@/lib/utils'

function getUserInitial(email?: string | null): string {
  if (!email) {
    return '?'
  }

  return email.charAt(0).toUpperCase()
}

export function AuthControls() {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const t = useTranslations('auth')
  const router = useRouter()

  if (status !== 'authenticated' || !session?.user) {
    return null
  }

  const email = session.user.email ?? ''
  const role = session.user.role

  async function handleSignOut() {
    resetAppState(queryClient)
    await signOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-9 max-w-[14rem] gap-2 px-2 sm:max-w-[16rem] sm:px-3'
        >
          <span className='bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
            {getUserInitial(email)}
          </span>
          <span className='hidden min-w-0 flex-1 flex-col items-start text-left sm:flex'>
            <span className='w-full truncate text-sm font-medium'>{email}</span>
            <span className='text-muted-foreground text-[0.65rem] uppercase tracking-wide'>
              {role}
            </span>
          </span>
          <ChevronDown className='text-muted-foreground size-4 shrink-0' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col gap-1.5'>
            <p className='truncate text-sm font-medium'>{email}</p>
            <Badge className='w-fit uppercase' variant='secondary'>
              {role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          className={cn('cursor-pointer')}
          onClick={() => void handleSignOut()}
        >
          <LogOut />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

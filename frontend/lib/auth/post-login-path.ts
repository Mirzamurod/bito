import type { UserRole } from '@/types/api'

export function getPostLoginPath(role?: UserRole | string | null): '/pos' | '/reports' {
  return role === 'admin' ? '/reports' : '/pos'
}

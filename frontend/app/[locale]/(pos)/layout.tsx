import type { ReactNode } from 'react'

export default function PosGroupLayout({ children }: { children: ReactNode }) {
  return <div className='flex min-h-full flex-1 flex-col'>{children}</div>
}

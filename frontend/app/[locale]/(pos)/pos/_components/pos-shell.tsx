'use client'

import { ProductSearch } from './product-search'
import { Cart } from './cart'

export function PosShell() {
  return (
    <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_min(100%,320px)]'>
      <ProductSearch />
      <Cart />
    </div>
  )
}

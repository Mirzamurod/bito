import { create } from 'zustand'

import type { Product } from '@/types/product'

export type CartItem = {
  productId: string
  quantity: number
  displayName?: string
  displayPrice?: number
  maxStock?: number
}

export type CheckoutItem = {
  productId: string
  quantity: number
}

type AddToCartInput = Pick<Product, 'id' | 'name' | 'price' | 'stock'>

type CartState = {
  items: CartItem[]
  stockErrorProductIds: string[]
  addItem: (product: AddToCartInput) => boolean
  removeItem: (productId: string) => void
  incrementItem: (productId: string) => boolean
  decrementItem: (productId: string) => void
  clearCart: () => void
  setStockErrorProductIds: (productIds: string[]) => void
  clearStockErrors: () => void
  getSubtotal: () => number
  getCheckoutItems: () => CheckoutItem[]
  restoreItemsFromOrder: (
    items: Array<{
      productId: string
      quantity: number
      name: string
      unitPrice: number
    }>,
  ) => void
}

function mapItems(
  items: CartItem[],
  productId: string,
  updater: (item: CartItem) => CartItem | null,
): CartItem[] {
  return items.flatMap(item => {
    if (item.productId !== productId) {
      return [item]
    }

    const next = updater(item)
    return next ? [next] : []
  })
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  stockErrorProductIds: [],

  addItem(product) {
    const { items } = get()
    const existing = items.find(item => item.productId === product.id)

    if (existing) {
      if (existing.quantity >= product.stock) {
        return false
      }

      set({
        items: mapItems(items, product.id, item => ({
          ...item,
          quantity: item.quantity + 1,
          maxStock: product.stock,
        })),
        stockErrorProductIds: [],
      })

      return true
    }

    if (product.stock < 1) {
      return false
    }

    set({
      items: [
        ...items,
        {
          productId: product.id,
          quantity: 1,
          displayName: product.name,
          displayPrice: product.price,
          maxStock: product.stock,
        },
      ],
      stockErrorProductIds: [],
    })

    return true
  },

  removeItem(productId) {
    set({
      items: get().items.filter(item => item.productId !== productId),
      stockErrorProductIds: get().stockErrorProductIds.filter(id => id !== productId),
    })
  },

  incrementItem(productId) {
    const target = get().items.find(item => item.productId === productId)

    if (!target) {
      return false
    }

    const maxStock = target.maxStock ?? Number.POSITIVE_INFINITY

    if (target.quantity >= maxStock) {
      return false
    }

    set({
      items: mapItems(get().items, productId, item => ({
        ...item,
        quantity: item.quantity + 1,
      })),
      stockErrorProductIds: [],
    })

    return true
  },

  decrementItem(productId) {
    const target = get().items.find(item => item.productId === productId)

    if (!target) {
      return
    }

    if (target.quantity <= 1) {
      get().removeItem(productId)
      return
    }

    set({
      items: mapItems(get().items, productId, item => ({
        ...item,
        quantity: item.quantity - 1,
      })),
      stockErrorProductIds: [],
    })
  },

  clearCart() {
    set({ items: [], stockErrorProductIds: [] })
  },

  setStockErrorProductIds(productIds) {
    set({ stockErrorProductIds: productIds })
  },

  clearStockErrors() {
    set({ stockErrorProductIds: [] })
  },

  getSubtotal() {
    return get().items.reduce((total, item) => total + (item.displayPrice ?? 0) * item.quantity, 0)
  },

  getCheckoutItems() {
    return get().items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  },

  restoreItemsFromOrder(items) {
    set({
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        displayName: item.name,
        displayPrice: item.unitPrice,
      })),
      stockErrorProductIds: [],
    })
  },
}))

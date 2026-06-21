export interface ProductCategory {
  id: string
  name: string
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: ProductCategory | null
}

export interface ProductListResult {
  items: Product[]
  page: number
  limit: number
  total: number
}

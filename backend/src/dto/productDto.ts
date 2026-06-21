import type { UserRole } from '../models/User'

export interface ProductCategoryDto {
  id: string
  name: string
}

export interface ProductDto {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: ProductCategoryDto | null
  costPrice?: number
}

type ProductSource = {
  _id: { toString(): string }
  name: string
  sku: string
  price: number
  stock: number
  costPrice: number
  category?: {
    _id: { toString(): string }
    name: string
  } | null
}

export function toProductDto(product: ProductSource, role: UserRole): ProductDto {
  const dto: ProductDto = {
    id: product._id.toString(),
    name: product.name,
    sku: product.sku,
    price: product.price,
    stock: product.stock,
    category: product.category
      ? {
          id: product.category._id.toString(),
          name: product.category.name,
        }
      : null,
  }

  if (role === 'admin') {
    dto.costPrice = product.costPrice
  }

  return dto
}

export function toProductListDto(products: ProductSource[], role: UserRole): ProductDto[] {
  return products.map(product => toProductDto(product, role))
}

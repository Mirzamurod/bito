import { Types } from 'mongoose'

import { Product } from '../models/Product'
import { escapeRegex, type PaginationMeta, type PaginationParams } from '../utils/pagination'

export interface ListProductsInput {
  tenantId: string
  search?: string
  pagination: PaginationParams
}

export interface ListProductsResult {
  items: Array<{
    _id: Types.ObjectId
    name: string
    sku: string
    price: number
    costPrice: number
    stock: number
    category: { _id: Types.ObjectId; name: string } | null
  }>
  meta: PaginationMeta
}

function buildSearchFilter(search?: string) {
  if (!search?.trim()) {
    return {}
  }

  const pattern = new RegExp(escapeRegex(search.trim()), 'i')

  return {
    $or: [{ name: pattern }, { sku: pattern }],
  }
}

export async function listProducts(input: ListProductsInput): Promise<ListProductsResult> {
  const tenantObjectId = new Types.ObjectId(input.tenantId)
  const { skip, limit, page } = input.pagination

  const [result] = await Product.aggregate<{
    items: ListProductsResult['items']
    total: Array<{ count: number }>
  }>([
    {
      $match: {
        tenantId: tenantObjectId,
        ...buildSearchFilter(input.search),
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    },
    { $sort: { name: 1 } },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              name: 1,
              sku: 1,
              price: 1,
              costPrice: 1,
              stock: 1,
              category: {
                _id: '$category._id',
                name: '$category.name',
              },
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ])

  const total = result?.total[0]?.count ?? 0
  const items = result?.items ?? []

  return {
    items,
    meta: {
      page,
      limit,
      total,
    },
  }
}

export async function syncProductIndexes(): Promise<void> {
  await Product.syncIndexes()
}

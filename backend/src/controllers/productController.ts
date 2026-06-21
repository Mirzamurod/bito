import type { Request, Response } from 'express';

import { toProductListDto } from '../dto/productDto';
import { AppError } from '../middleware/errorHandler';
import { listProducts } from '../services/productService';
import { parsePagination } from '../utils/pagination';

function parsePaginationQuery(req: Request) {
  try {
    return parsePagination(
      req.query.page !== undefined ? String(req.query.page) : undefined,
      req.query.limit !== undefined ? String(req.query.limit) : undefined,
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PAGE') {
      throw new AppError(400, 'INVALID_PAGE', 'Page must be a positive integer');
    }

    if (error instanceof Error && error.message === 'INVALID_LIMIT') {
      throw new AppError(400, 'INVALID_LIMIT', 'Limit must be between 1 and 100');
    }

    throw error;
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const pagination = parsePaginationQuery(req);
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  const result = await listProducts({
    tenantId: req.user!.tenantId,
    search,
    pagination,
  });

  res.json({
    data: {
      items: toProductListDto(result.items, req.user!.role),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    },
  });
}

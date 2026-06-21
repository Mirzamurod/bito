import { Router } from 'express';

import { authController } from '../controllers';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.get(
  '/me',
  authenticate,
  requireTenant,
  asyncHandler(authController.getMe),
);

router.get(
  '/admin/check',
  authenticate,
  requireTenant,
  roleGuard('admin'),
  asyncHandler(authController.adminCheck),
);

export const authRouter = router;

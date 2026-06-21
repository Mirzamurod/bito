import type { Request, Response } from 'express';

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({
    data: {
      userId: req.user!.userId,
      tenantId: req.user!.tenantId,
      role: req.user!.role,
    },
  });
}

export async function adminCheck(_req: Request, res: Response): Promise<void> {
  res.json({ data: { ok: true } });
}

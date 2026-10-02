import { Router } from 'express';
import type { ShopApplicationService } from '../../application/ShopApplicationService.js';

export function createStaffRouter(shopService: ShopApplicationService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await shopService.getServers());
  });

  return router;
}

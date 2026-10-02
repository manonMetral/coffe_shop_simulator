import { Router } from 'express';
import type { MenuApplicationService } from '../../application/MenuApplicationService.js';

export function createMenuRouter(menuService: MenuApplicationService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await menuService.getMenu());
  });

  return router;
}

import { Router } from 'express';
import type { InventoryApplicationService } from '../../application/InventoryApplicationService.js';

export function createInventoryRouter(inventoryService: InventoryApplicationService): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await inventoryService.getInventory());
  });

  return router;
}

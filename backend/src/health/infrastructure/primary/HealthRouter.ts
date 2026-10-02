import { Router } from 'express';
import type { HealthApplicationService } from '../../application/HealthApplicationService.js';

export function createHealthRouter(healthService: HealthApplicationService): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(healthService.getHealth());
  });

  return router;
}

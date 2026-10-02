import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { HealthApplicationService } from './health/application/HealthApplicationService.js';
import { createHealthRouter } from './health/infrastructure/primary/HealthRouter.js';
import { ProcessUptimeProvider } from './health/infrastructure/secondary/ProcessUptimeProvider.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  const healthService = new HealthApplicationService(new ProcessUptimeProvider());
  app.use('/api/health', createHealthRouter(healthService));

  return app;
}

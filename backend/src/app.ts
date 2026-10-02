import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use('/api/health', healthRouter);

  return app;
}

import cors from 'cors';
import express from 'express';
import { createShopModule, type ShopModule } from './composition/shop.js';
import { config } from './config.js';
import { HealthApplicationService } from './health/application/HealthApplicationService.js';
import { createHealthRouter } from './health/infrastructure/primary/HealthRouter.js';
import { ProcessUptimeProvider } from './health/infrastructure/secondary/ProcessUptimeProvider.js';
import { createInventoryRouter } from './shop/infrastructure/primary/InventoryRouter.js';
import { createMenuRouter } from './shop/infrastructure/primary/MenuRouter.js';
import { createStaffRouter } from './shop/infrastructure/primary/StaffRouter.js';

export function createApp(shop: ShopModule = createShopModule()) {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  const healthService = new HealthApplicationService(new ProcessUptimeProvider());
  app.use('/api/health', createHealthRouter(healthService));
  app.use('/api/menu', createMenuRouter(shop.menuService));
  app.use('/api/inventory', createInventoryRouter(shop.inventoryService));
  app.use('/api/staff', createStaffRouter(shop.shopService));

  return app;
}

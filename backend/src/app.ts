import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { HealthApplicationService } from './health/application/HealthApplicationService.js';
import { createHealthRouter } from './health/infrastructure/primary/HealthRouter.js';
import { ProcessUptimeProvider } from './health/infrastructure/secondary/ProcessUptimeProvider.js';
import { InventoryApplicationService } from './shop/application/InventoryApplicationService.js';
import { MenuApplicationService } from './shop/application/MenuApplicationService.js';
import { Inventory } from './shop/domain/inventory/Inventory.js';
import { createInventoryRouter } from './shop/infrastructure/primary/InventoryRouter.js';
import { createMenuRouter } from './shop/infrastructure/primary/MenuRouter.js';
import { createDefaultMenu } from './shop/infrastructure/secondary/DefaultCatalog.js';
import { InMemoryInventoryRepository } from './shop/infrastructure/secondary/InMemoryInventoryRepository.js';
import { InMemoryMenuRepository } from './shop/infrastructure/secondary/InMemoryMenuRepository.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  const healthService = new HealthApplicationService(new ProcessUptimeProvider());
  app.use('/api/health', createHealthRouter(healthService));

  const menu = createDefaultMenu();
  const menuRepository = new InMemoryMenuRepository(menu);
  const inventoryRepository = new InMemoryInventoryRepository(
    Inventory.full(
      menu.ingredients().map((ingredient) => ingredient.name),
      config.stockCapacity,
      config.lowStockThreshold,
    ),
  );
  app.use('/api/menu', createMenuRouter(new MenuApplicationService(menuRepository)));
  app.use(
    '/api/inventory',
    createInventoryRouter(new InventoryApplicationService(inventoryRepository, menuRepository)),
  );

  return app;
}

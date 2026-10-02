import { config } from '../config.js';
import { FinanceApplicationService } from '../shop/application/FinanceApplicationService.js';
import { InventoryApplicationService } from '../shop/application/InventoryApplicationService.js';
import { MenuApplicationService } from '../shop/application/MenuApplicationService.js';
import { CashRegister } from '../shop/domain/finance/CashRegister.js';
import { Inventory } from '../shop/domain/inventory/Inventory.js';
import { Money } from '../shop/domain/Money.js';
import { TypeScriptFinance } from '../shop/infrastructure/primary/TypeScriptFinance.js';
import { createDefaultMenu } from '../shop/infrastructure/secondary/DefaultCatalog.js';
import { InMemoryCashRegisterRepository } from '../shop/infrastructure/secondary/InMemoryCashRegisterRepository.js';
import { InMemoryInventoryRepository } from '../shop/infrastructure/secondary/InMemoryInventoryRepository.js';
import { InMemoryMenuRepository } from '../shop/infrastructure/secondary/InMemoryMenuRepository.js';

/** Wires the shop bounded context. */
export function createShopModule() {
  const menu = createDefaultMenu();
  const menuRepository = new InMemoryMenuRepository(menu);
  const inventoryRepository = new InMemoryInventoryRepository(
    Inventory.full(
      menu.ingredients().map((ingredient) => ingredient.name),
      config.stockCapacity,
      config.lowStockThreshold,
    ),
  );
  const cashRegisterRepository = new InMemoryCashRegisterRepository(
    new CashRegister(Money.ofCents(config.initialCashCents)),
  );

  return {
    menuService: new MenuApplicationService(menuRepository),
    inventoryService: new InventoryApplicationService(inventoryRepository, menuRepository),
    finance: new TypeScriptFinance(new FinanceApplicationService(cashRegisterRepository)),
  };
}

export type ShopModule = ReturnType<typeof createShopModule>;

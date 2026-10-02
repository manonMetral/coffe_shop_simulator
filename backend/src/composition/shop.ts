import { config } from '../config.js';
import { CustomerApplicationService } from '../shop/application/CustomerApplicationService.js';
import { FinanceApplicationService } from '../shop/application/FinanceApplicationService.js';
import { InventoryApplicationService } from '../shop/application/InventoryApplicationService.js';
import { MenuApplicationService } from '../shop/application/MenuApplicationService.js';
import { CustomerGenerator } from '../shop/domain/customer/CustomerGenerator.js';
import { CustomerQueue } from '../shop/domain/customer/CustomerQueue.js';
import { CashRegister } from '../shop/domain/finance/CashRegister.js';
import { Inventory } from '../shop/domain/inventory/Inventory.js';
import { Money } from '../shop/domain/Money.js';
import { TypeScriptCustomers } from '../shop/infrastructure/primary/TypeScriptCustomers.js';
import { TypeScriptFinance } from '../shop/infrastructure/primary/TypeScriptFinance.js';
import { createDefaultMenu } from './defaultMenu.js';
import { InMemoryCustomerQueueRepository } from '../shop/infrastructure/secondary/InMemoryCustomerQueueRepository.js';
import { SeededRandomGenerator } from '../shop/infrastructure/secondary/SeededRandomGenerator.js';
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

  const customerService = new CustomerApplicationService(
    new InMemoryCustomerQueueRepository(new CustomerQueue()),
    new CustomerGenerator(
      new SeededRandomGenerator(config.randomSeed),
      menu.drinks().map((drink) => drink.name),
      config.customersPerHour,
    ),
  );

  return {
    menuService: new MenuApplicationService(menuRepository),
    inventoryService: new InventoryApplicationService(inventoryRepository, menuRepository),
    finance: new TypeScriptFinance(new FinanceApplicationService(cashRegisterRepository)),
    customers: new TypeScriptCustomers(customerService),
  };
}

export type ShopModule = ReturnType<typeof createShopModule>;

import { config } from '../config.js';
import { MenuApplicationService } from '../shop/application/MenuApplicationService.js';
import { InventoryApplicationService } from '../shop/application/InventoryApplicationService.js';
import { ShopApplicationService } from '../shop/application/ShopApplicationService.js';
import { CustomerGenerator } from '../shop/domain/customer/CustomerGenerator.js';
import { CustomerQueue } from '../shop/domain/customer/CustomerQueue.js';
import { CashRegister } from '../shop/domain/finance/CashRegister.js';
import { Inventory } from '../shop/domain/inventory/Inventory.js';
import { Money } from '../shop/domain/Money.js';
import { OrderDispatcher } from '../shop/domain/order/OrderDispatcher.js';
import { Ledger } from '../shop/domain/report/Ledger.js';
import { PendingRestocks } from '../shop/domain/restock/PendingRestocks.js';
import { TypeScriptShop } from '../shop/infrastructure/primary/TypeScriptShop.js';
import { InMemoryCashRegisterRepository } from '../shop/infrastructure/secondary/InMemoryCashRegisterRepository.js';
import { InMemoryCustomerQueueRepository } from '../shop/infrastructure/secondary/InMemoryCustomerQueueRepository.js';
import { InMemoryInventoryRepository } from '../shop/infrastructure/secondary/InMemoryInventoryRepository.js';
import { InMemoryLedgerRepository } from '../shop/infrastructure/secondary/InMemoryLedgerRepository.js';
import { InMemoryMenuRepository } from '../shop/infrastructure/secondary/InMemoryMenuRepository.js';
import { InMemoryPendingRestocksRepository } from '../shop/infrastructure/secondary/InMemoryPendingRestocksRepository.js';
import { InMemoryStaffRepository } from '../shop/infrastructure/secondary/InMemoryStaffRepository.js';
import { SeededRandomGenerator } from '../shop/infrastructure/secondary/SeededRandomGenerator.js';
import { createDefaultMenu } from './defaultMenu.js';
import { createDefaultStaff } from './defaultStaff.js';

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
  // One generator for the customers and the tips: a seed replays the whole simulation.
  const random = new SeededRandomGenerator(config.randomSeed);

  const shopService = new ShopApplicationService({
    queueRepository: new InMemoryCustomerQueueRepository(new CustomerQueue()),
    staffRepository: new InMemoryStaffRepository(createDefaultStaff()),
    cashRegisterRepository: new InMemoryCashRegisterRepository(
      new CashRegister(Money.ofCents(config.initialCashCents)),
    ),
    inventoryRepository,
    menuRepository,
    pendingRestocksRepository: new InMemoryPendingRestocksRepository(new PendingRestocks()),
    ledgerRepository: new InMemoryLedgerRepository(new Ledger()),
    customerGenerator: new CustomerGenerator(
      random,
      menu.drinks().map((drink) => drink.name),
      config.customersPerHour,
    ),
    orderDispatcher: new OrderDispatcher(),
    random,
    restockDelayMinutes: config.restockDelayMinutes,
  });

  return {
    menuService: new MenuApplicationService(menuRepository),
    inventoryService: new InventoryApplicationService(inventoryRepository, menuRepository),
    shopService,
    shop: new TypeScriptShop(shopService),
  };
}

export type ShopModule = ReturnType<typeof createShopModule>;

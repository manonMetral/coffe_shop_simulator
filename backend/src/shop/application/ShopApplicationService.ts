import type { CustomerGenerator } from '../domain/customer/CustomerGenerator.js';
import type { CustomerQueueRepository } from '../domain/customer/CustomerQueueRepository.js';
import type { RandomGenerator } from '../domain/customer/RandomGenerator.js';
import type { CashRegisterRepository } from '../domain/finance/CashRegisterRepository.js';
import { tipFor } from '../domain/finance/Tip.js';
import type { InventoryRepository } from '../domain/inventory/InventoryRepository.js';
import type { MenuRepository } from '../domain/menu/MenuRepository.js';
import type { OrderDispatcher } from '../domain/order/OrderDispatcher.js';
import type { DayReport } from '../domain/report/DayReport.js';
import type { LedgerRepository } from '../domain/report/LedgerRepository.js';
import { Restock } from '../domain/restock/Restock.js';
import type { PendingRestocksRepository } from '../domain/restock/PendingRestocksRepository.js';
import { planRestocks } from '../domain/restock/RestockPolicy.js';
import type { StaffRepository } from '../domain/staff/StaffRepository.js';
import {
  type ServerView,
  type ShopEvent,
  type ShopSnapshot,
  toCustomerView,
  toServerView,
  toStockViews,
} from './ShopViews.js';

export interface ShopDependencies {
  readonly queueRepository: CustomerQueueRepository;
  readonly staffRepository: StaffRepository;
  readonly cashRegisterRepository: CashRegisterRepository;
  readonly inventoryRepository: InventoryRepository;
  readonly menuRepository: MenuRepository;
  readonly pendingRestocksRepository: PendingRestocksRepository;
  readonly ledgerRepository: LedgerRepository;
  readonly customerGenerator: CustomerGenerator;
  readonly orderDispatcher: OrderDispatcher;
  readonly random: RandomGenerator;
  /** Simulated minutes between the purchase of ingredients and their delivery. */
  readonly restockDelayMinutes: number;
}

export class ShopApplicationService {
  constructor(private readonly dependencies: ShopDependencies) {}

  async getServers(): Promise<ServerView[]> {
    return (await this.dependencies.staffRepository.get()).servers().map(toServerView);
  }

  async getReports(): Promise<DayReport[]> {
    return [...(await this.dependencies.ledgerRepository.get()).reports()];
  }

  async getSnapshot(): Promise<ShopSnapshot> {
    const { queueRepository, cashRegisterRepository, inventoryRepository } = this.dependencies;
    const [queue, cashRegister, inventory, servers, reports] = await Promise.all([
      queueRepository.get(),
      cashRegisterRepository.get(),
      inventoryRepository.get(),
      this.getServers(),
      this.getReports(),
    ]);
    return {
      cashCents: cashRegister.balance().cents,
      queue: queue.customers().map(toCustomerView),
      servers,
      inventory: toStockViews(inventory),
      reports,
    };
  }

  /**
   * Lets the simulated time go by: ordered ingredients arrive, the servers deliver their drinks and
   * are paid, waiting customers lose patience, new customers arrive, the idle servers take the customers
   * who wait, and the missing ingredients are bought.
   * @param arrivalMultiplier 1 on a normal day, more during a rush hour.
   */
  async advance(simulatedMinutes: number, arrivalMultiplier = 1): Promise<ShopEvent[]> {
    const { queueRepository, staffRepository, cashRegisterRepository, inventoryRepository } =
      this.dependencies;
    const { menuRepository, pendingRestocksRepository, ledgerRepository } = this.dependencies;
    const [queue, staff, cashRegister, inventory, menu, pendingRestocks, ledger] =
      await Promise.all([
        queueRepository.get(),
        staffRepository.get(),
        cashRegisterRepository.get(),
        inventoryRepository.get(),
        menuRepository.get(),
        pendingRestocksRepository.get(),
        ledgerRepository.get(),
      ]);
    const events: ShopEvent[] = [];

    for (const restock of pendingRestocks.advance(simulatedMinutes)) {
      inventory.restock(restock.ingredient, restock.quantity);
      events.push({
        type: 'restock-delivered',
        ingredient: restock.ingredient,
        quantity: restock.quantity,
      });
    }

    for (const server of staff.servers()) {
      const delivered = server.work(simulatedMinutes);
      if (delivered) {
        const tip = tipFor(delivered.customer, delivered.price, this.dependencies.random);
        cashRegister.deposit(delivered.price.plus(tip));
        ledger.recordSale(delivered.price, tip, delivered.satisfactionPercent);
        events.push({
          type: 'order-delivered',
          orderId: delivered.id,
          customerId: delivered.customer.id,
          drink: delivered.drink,
          server: delivered.server,
          priceCents: delivered.price.cents,
          tipCents: tip.cents,
          cashCents: cashRegister.balance().cents,
        });
      }
    }

    for (const customer of queue.wait(simulatedMinutes)) {
      ledger.recordLostCustomer('patience');
      events.push({ type: 'customer-left', customerId: customer.id, reason: 'patience' });
    }

    const arrivals = this.dependencies.customerGenerator.advance(
      simulatedMinutes,
      arrivalMultiplier,
    );
    for (const customer of arrivals) {
      queue.enqueue(customer);
      events.push({ type: 'customer-arrived', customer: toCustomerView(customer) });
    }

    const { started, turnedAway, stockAlerts } = this.dependencies.orderDispatcher.dispatch(
      queue,
      staff,
      menu,
      inventory,
    );
    for (const order of started) {
      events.push({
        type: 'order-started',
        orderId: order.id,
        customerId: order.customer.id,
        drink: order.drink,
        server: order.server,
      });
    }
    for (const customer of turnedAway) {
      ledger.recordLostCustomer('out-of-stock');
      events.push({ type: 'customer-left', customerId: customer.id, reason: 'out-of-stock' });
    }
    for (const { ingredient, remaining } of stockAlerts) {
      events.push({ type: 'stock-low', ingredient, remaining });
    }

    const purchases = planRestocks(
      cashRegister.balance(),
      menu.ingredients(),
      inventory,
      pendingRestocks.ingredients(),
    );
    for (const { ingredient, quantity, cost } of purchases) {
      cashRegister.withdraw(cost);
      ledger.recordRestock(cost);
      pendingRestocks.add(
        new Restock(ingredient, quantity, cost, this.dependencies.restockDelayMinutes),
      );
      events.push({
        type: 'restock-ordered',
        ingredient,
        quantity,
        costCents: cost.cents,
        cashCents: cashRegister.balance().cents,
      });
    }

    await Promise.all([
      queueRepository.save(queue),
      staffRepository.save(staff),
      cashRegisterRepository.save(cashRegister),
      inventoryRepository.save(inventory),
      pendingRestocksRepository.save(pendingRestocks),
      ledgerRepository.save(ledger),
    ]);

    events.push(
      { type: 'queue-updated', queue: queue.customers().map(toCustomerView) },
      { type: 'servers-updated', servers: staff.servers().map(toServerView) },
      { type: 'inventory-updated', inventory: toStockViews(inventory) },
    );
    return events;
  }

  /** Ends a day: the accounts are closed into a report, and the next day starts from zero. */
  async closeDay(day: number): Promise<ShopEvent[]> {
    const { cashRegisterRepository, ledgerRepository } = this.dependencies;
    const [cashRegister, ledger] = await Promise.all([
      cashRegisterRepository.get(),
      ledgerRepository.get(),
    ]);
    const report = ledger.closeDay(day, cashRegister.balance());
    await ledgerRepository.save(ledger);
    return [{ type: 'day-report', report }];
  }
}

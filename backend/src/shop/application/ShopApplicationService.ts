import type { CustomerGenerator } from '../domain/customer/CustomerGenerator.js';
import type { CustomerQueueRepository } from '../domain/customer/CustomerQueueRepository.js';
import type { RandomGenerator } from '../domain/customer/RandomGenerator.js';
import type { CashRegisterRepository } from '../domain/finance/CashRegisterRepository.js';
import { tipFor } from '../domain/finance/Tip.js';
import type { InventoryRepository } from '../domain/inventory/InventoryRepository.js';
import type { MenuRepository } from '../domain/menu/MenuRepository.js';
import type { OrderDispatcher } from '../domain/order/OrderDispatcher.js';
import type { StaffRepository } from '../domain/staff/StaffRepository.js';
import {
  type ServerView,
  type ShopEvent,
  type ShopSnapshot,
  toCustomerView,
  toServerView,
} from './ShopViews.js';

export interface ShopDependencies {
  readonly queueRepository: CustomerQueueRepository;
  readonly staffRepository: StaffRepository;
  readonly cashRegisterRepository: CashRegisterRepository;
  readonly inventoryRepository: InventoryRepository;
  readonly menuRepository: MenuRepository;
  readonly customerGenerator: CustomerGenerator;
  readonly orderDispatcher: OrderDispatcher;
  readonly random: RandomGenerator;
}

export class ShopApplicationService {
  constructor(private readonly dependencies: ShopDependencies) {}

  async getServers(): Promise<ServerView[]> {
    return (await this.dependencies.staffRepository.get()).servers().map(toServerView);
  }

  async getSnapshot(): Promise<ShopSnapshot> {
    const { queueRepository, cashRegisterRepository } = this.dependencies;
    const [queue, cashRegister, servers] = await Promise.all([
      queueRepository.get(),
      cashRegisterRepository.get(),
      this.getServers(),
    ]);
    return {
      cashCents: cashRegister.balance().cents,
      queue: queue.customers().map(toCustomerView),
      servers,
    };
  }

  /**
   * Lets the simulated time go by: the servers deliver their drinks and are paid, waiting customers
   * lose patience, new customers arrive, and the idle servers take the customers who wait.
   */
  async advance(simulatedMinutes: number): Promise<ShopEvent[]> {
    const {
      queueRepository,
      staffRepository,
      cashRegisterRepository,
      inventoryRepository,
      menuRepository,
    } = this.dependencies;
    const [queue, staff, cashRegister, inventory, menu] = await Promise.all([
      queueRepository.get(),
      staffRepository.get(),
      cashRegisterRepository.get(),
      inventoryRepository.get(),
      menuRepository.get(),
    ]);
    const events: ShopEvent[] = [];

    for (const server of staff.servers()) {
      const delivered = server.work(simulatedMinutes);
      if (delivered) {
        const tip = tipFor(delivered.customer, delivered.price, this.dependencies.random);
        cashRegister.deposit(delivered.price.plus(tip));
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
      events.push({ type: 'customer-left', customerId: customer.id, reason: 'patience' });
    }

    for (const customer of this.dependencies.customerGenerator.advance(simulatedMinutes)) {
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
      events.push({ type: 'customer-left', customerId: customer.id, reason: 'out-of-stock' });
    }
    for (const { ingredient, remaining } of stockAlerts) {
      events.push({ type: 'stock-low', ingredient, remaining });
    }

    await Promise.all([
      queueRepository.save(queue),
      staffRepository.save(staff),
      cashRegisterRepository.save(cashRegister),
      inventoryRepository.save(inventory),
    ]);

    events.push(
      { type: 'queue-updated', queue: queue.customers().map(toCustomerView) },
      { type: 'servers-updated', servers: staff.servers().map(toServerView) },
    );
    return events;
  }
}

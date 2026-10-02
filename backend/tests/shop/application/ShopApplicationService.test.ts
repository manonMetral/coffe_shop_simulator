import { describe, expect, it } from 'vitest';
import { ShopApplicationService } from '../../../src/shop/application/ShopApplicationService.js';
import { Customer } from '../../../src/shop/domain/customer/Customer.js';
import type { CustomerGenerator } from '../../../src/shop/domain/customer/CustomerGenerator.js';
import { CustomerQueue } from '../../../src/shop/domain/customer/CustomerQueue.js';
import { Personality } from '../../../src/shop/domain/customer/Personality.js';
import { CashRegister } from '../../../src/shop/domain/finance/CashRegister.js';
import { Inventory } from '../../../src/shop/domain/inventory/Inventory.js';
import { DrinkName } from '../../../src/shop/domain/menu/DrinkName.js';
import { IngredientName } from '../../../src/shop/domain/menu/IngredientName.js';
import { Money } from '../../../src/shop/domain/Money.js';
import { OrderDispatcher } from '../../../src/shop/domain/order/OrderDispatcher.js';
import { Ledger } from '../../../src/shop/domain/report/Ledger.js';
import { PendingRestocks } from '../../../src/shop/domain/restock/PendingRestocks.js';
import { Recipe } from '../../../src/shop/domain/menu/Recipe.js';
import { Server } from '../../../src/shop/domain/staff/Server.js';
import { ServerName } from '../../../src/shop/domain/staff/ServerName.js';
import { Staff } from '../../../src/shop/domain/staff/Staff.js';
import { InMemoryCashRegisterRepository } from '../../../src/shop/infrastructure/secondary/InMemoryCashRegisterRepository.js';
import { InMemoryCustomerQueueRepository } from '../../../src/shop/infrastructure/secondary/InMemoryCustomerQueueRepository.js';
import { InMemoryInventoryRepository } from '../../../src/shop/infrastructure/secondary/InMemoryInventoryRepository.js';
import { InMemoryLedgerRepository } from '../../../src/shop/infrastructure/secondary/InMemoryLedgerRepository.js';
import { InMemoryMenuRepository } from '../../../src/shop/infrastructure/secondary/InMemoryMenuRepository.js';
import { InMemoryPendingRestocksRepository } from '../../../src/shop/infrastructure/secondary/InMemoryPendingRestocksRepository.js';
import { InMemoryStaffRepository } from '../../../src/shop/infrastructure/secondary/InMemoryStaffRepository.js';
import { createTestMenu } from '../testMenu.js';

const { ESPRESSO, LATTE } = DrinkName;
const { COFFEE, MILK } = IngredientName;

interface Options {
  arrivals?: Customer[][];
  servers?: Server[];
  stock?: { capacity: number; threshold: number };
  /** Units of coffee already used, to start with a low stock. */
  coffeeUsed?: number;
  cashCents?: number;
  draw?: number;
  restockDelayMinutes?: number;
}

function createShop(options: Options = {}) {
  const arrivals = [...(options.arrivals ?? [])];
  const arrivalMultipliers: number[] = [];
  const queue = new CustomerQueue();
  const staff = new Staff(options.servers ?? [new Server(ServerName.ALICE, 1, [ESPRESSO, LATTE])]);
  const stock = options.stock ?? { capacity: 1000, threshold: 100 };
  const inventory = Inventory.full([COFFEE, MILK], stock.capacity, stock.threshold);
  if (options.coffeeUsed) {
    inventory.consume(new Recipe([{ ingredient: COFFEE, quantity: options.coffeeUsed }]));
  }
  const service = new ShopApplicationService({
    queueRepository: new InMemoryCustomerQueueRepository(queue),
    staffRepository: new InMemoryStaffRepository(staff),
    cashRegisterRepository: new InMemoryCashRegisterRepository(
      new CashRegister(Money.ofCents(options.cashCents ?? 30000)),
    ),
    inventoryRepository: new InMemoryInventoryRepository(inventory),
    menuRepository: new InMemoryMenuRepository(createTestMenu()),
    pendingRestocksRepository: new InMemoryPendingRestocksRepository(new PendingRestocks()),
    ledgerRepository: new InMemoryLedgerRepository(new Ledger()),
    customerGenerator: {
      advance: (_minutes: number, multiplier: number) => {
        arrivalMultipliers.push(multiplier);
        return arrivals.shift() ?? [];
      },
    } as unknown as CustomerGenerator,
    orderDispatcher: new OrderDispatcher(),
    random: { next: () => options.draw ?? 0 },
    restockDelayMinutes: options.restockDelayMinutes ?? 60,
  });
  return { service, queue, staff, inventory, arrivalMultipliers };
}

const types = (events: { type: string }[]) => events.map((event) => event.type);

describe('ShopApplicationService', () => {
  describe('snapshot', () => {
    it('shows the cash, an empty queue and idle servers at the start', async () => {
      const { service } = createShop();

      expect(await service.getSnapshot()).toEqual({
        cashCents: 30000,
        queue: [],
        servers: [{ name: 'Alice', speed: 1, drinks: ['Espresso', 'Latte'], order: null }],
        inventory: [
          { ingredient: 'Café', quantity: 1000, capacity: 1000, low: false },
          { ingredient: 'Lait', quantity: 1000, capacity: 1000, low: false },
        ],
        reports: [],
      });
    });
  });

  describe('a customer arrives', () => {
    it('is served right away by an idle server', async () => {
      const { service } = createShop({
        arrivals: [[new Customer(1, Personality.RELAXED, ESPRESSO)]],
      });

      const events = await service.advance(0.1);

      expect(types(events)).toEqual([
        'customer-arrived',
        'order-started',
        'queue-updated',
        'servers-updated',
        'inventory-updated',
      ]);
      expect(events[1]).toEqual({
        type: 'order-started',
        orderId: 1,
        customerId: 1,
        drink: 'Espresso',
        server: 'Alice',
      });
      expect(events[2]).toEqual({ type: 'queue-updated', queue: [] });
      const snapshot = await service.getSnapshot();
      expect(snapshot.servers[0]?.order).toEqual({
        orderId: 1,
        customerId: 1,
        drink: 'Espresso',
        preparationMinutes: 2,
        remainingMinutes: 2,
      });
    });

    it('waits when every server is busy', async () => {
      const { service } = createShop({
        arrivals: [
          [new Customer(1, Personality.RELAXED, ESPRESSO)],
          [new Customer(2, Personality.RELAXED, ESPRESSO)],
        ],
      });

      await service.advance(0.1);
      const events = await service.advance(0.1);

      expect(types(events)).toEqual([
        'customer-arrived',
        'queue-updated',
        'servers-updated',
        'inventory-updated',
      ]);
      expect((await service.getSnapshot()).queue.map((customer) => customer.id)).toEqual([2]);
    });
  });

  describe('a drink is delivered', () => {
    it('is paid at the price of the menu', async () => {
      const { service } = createShop({
        arrivals: [[new Customer(1, Personality.RELAXED, ESPRESSO)]],
      });
      await service.advance(0.1);

      const events = await service.advance(2);

      expect(events[0]).toEqual({
        type: 'order-delivered',
        orderId: 1,
        customerId: 1,
        drink: 'Espresso',
        server: 'Alice',
        priceCents: 520,
        tipCents: 0,
        cashCents: 30520,
      });
      const snapshot = await service.getSnapshot();
      expect(snapshot.cashCents).toBe(30520);
      expect(snapshot.servers[0]?.order).toBeNull();
    });

    it('comes with a tip when the customer is generous', async () => {
      const { service } = createShop({
        arrivals: [[new Customer(1, Personality.GENEROUS, ESPRESSO)]],
        draw: 0.5,
      });
      await service.advance(0.1);

      const events = await service.advance(2);

      expect(events[0]).toMatchObject({
        type: 'order-delivered',
        priceCents: 520,
        tipCents: 78,
        cashCents: 30598,
      });
    });

    it('lets the server take the next customer in the same tick', async () => {
      const { service } = createShop({
        arrivals: [
          [new Customer(1, Personality.RELAXED, ESPRESSO)],
          [new Customer(2, Personality.RELAXED, ESPRESSO)],
        ],
      });
      await service.advance(0.1);
      await service.advance(0.1);

      const events = await service.advance(2);

      expect(types(events)).toEqual([
        'order-delivered',
        'order-started',
        'queue-updated',
        'servers-updated',
        'inventory-updated',
      ]);
      expect(events[1]).toMatchObject({ type: 'order-started', customerId: 2 });
    });
  });

  describe('customers who leave', () => {
    it('lose patience while the servers are busy', async () => {
      const { service } = createShop({
        arrivals: [
          [new Customer(1, Personality.RELAXED, LATTE)],
          [new Customer(2, Personality.RUSHED, LATTE)],
        ],
      });
      await service.advance(0.1);
      await service.advance(0.1);

      expect(await service.advance(3)).not.toContainEqual({
        type: 'customer-left',
        customerId: 2,
        reason: 'patience',
      });
      const events = await service.advance(3);

      expect(events).toContainEqual({ type: 'customer-left', customerId: 2, reason: 'patience' });
    });

    it('are turned away when the ingredients of their drink are missing', async () => {
      const { service } = createShop({
        arrivals: [[new Customer(1, Personality.RELAXED, ESPRESSO)]],
        stock: { capacity: 1, threshold: 0 },
      });

      const events = await service.advance(0.1);

      expect(types(events)).toEqual([
        'customer-arrived',
        'customer-left',
        'queue-updated',
        'servers-updated',
        'inventory-updated',
      ]);
      expect(events[1]).toEqual({ type: 'customer-left', customerId: 1, reason: 'out-of-stock' });
      expect((await service.getSnapshot()).servers[0]?.order).toBeNull();
    });
  });

  describe('stock', () => {
    it('raises an alert when an ingredient reaches the threshold', async () => {
      const { service } = createShop({
        arrivals: [[new Customer(1, Personality.RELAXED, ESPRESSO)]],
        stock: { capacity: 102, threshold: 100 },
      });

      const events = await service.advance(0.1);

      expect(events).toContainEqual({ type: 'stock-low', ingredient: 'Café', remaining: 100 });
    });
  });

  describe('servers', () => {
    it('are listed with their speed and their skills', async () => {
      const { service } = createShop({
        servers: [
          new Server(ServerName.BOB, 1.5, [ESPRESSO]),
          new Server(ServerName.CHLOE, 0.8, [LATTE]),
        ],
      });

      expect(
        (await service.getServers()).map(({ name, speed, drinks }) => ({ name, speed, drinks })),
      ).toEqual([
        { name: 'Bob', speed: 1.5, drinks: ['Espresso'] },
        { name: 'Chloé', speed: 0.8, drinks: ['Latte'] },
      ]);
    });

    it('show the time left on the order they prepare, with one decimal', async () => {
      const { service } = createShop({
        arrivals: [[new Customer(1, Personality.RELAXED, LATTE)]],
        servers: [new Server(ServerName.ALICE, 3, [LATTE])],
      });
      await service.advance(0.1);
      await service.advance(0.5);

      const order = (await service.getSnapshot()).servers[0]?.order;

      expect(order).toMatchObject({ preparationMinutes: 1.3, remainingMinutes: 0.8 });
    });
  });

  describe('arrival rate', () => {
    it('is passed to the customer generator', async () => {
      const { service, arrivalMultipliers } = createShop();

      await service.advance(1);
      await service.advance(1, 2.5);

      expect(arrivalMultipliers).toEqual([1, 2.5]);
    });
  });

  describe('restocking', () => {
    const lowCoffee = { coffeeUsed: 900, cashCents: 100000 };

    it('buys the missing ingredients when the stock is low and the budget allows it', async () => {
      const { service } = createShop(lowCoffee);

      const events = await service.advance(1);

      expect(events).toContainEqual({
        type: 'restock-ordered',
        ingredient: 'Café',
        quantity: 250,
        costCents: 50000,
        cashCents: 50000,
      });
      expect((await service.getSnapshot()).cashCents).toBe(50000);
    });

    it('buys nothing while the budget of the ingredient does not allow 100 units', async () => {
      const { service } = createShop({ coffeeUsed: 900, cashCents: 30000 });

      const events = await service.advance(1);

      expect(events.some((event) => event.type === 'restock-ordered')).toBe(false);
      expect((await service.getSnapshot()).cashCents).toBe(30000);
    });

    it('does not order the same ingredient again while it is being delivered', async () => {
      const { service } = createShop(lowCoffee);

      await service.advance(1);
      const events = await service.advance(1);

      expect(events.some((event) => event.type === 'restock-ordered')).toBe(false);
    });

    it('delivers the units after the delay, which fills the stock', async () => {
      const { service } = createShop({ ...lowCoffee, restockDelayMinutes: 60 });
      await service.advance(1);

      const early = await service.advance(59);
      expect(early.some((event) => event.type === 'restock-delivered')).toBe(false);
      expect((await service.getSnapshot()).inventory[0]).toMatchObject({
        quantity: 100,
        low: true,
      });

      const events = await service.advance(1);
      expect(events[0]).toEqual({ type: 'restock-delivered', ingredient: 'Café', quantity: 250 });
      expect((await service.getSnapshot()).inventory[0]).toMatchObject({
        quantity: 350,
        low: false,
      });
    });

    it('shows the stock in the events', async () => {
      const { service } = createShop(lowCoffee);

      const events = await service.advance(1);

      expect(events.at(-1)).toEqual({
        type: 'inventory-updated',
        inventory: [
          { ingredient: 'Café', quantity: 100, capacity: 1000, low: true },
          { ingredient: 'Lait', quantity: 1000, capacity: 1000, low: false },
        ],
      });
    });
  });

  describe('accounts of the day', () => {
    it('closes into a report with the sales, the tips, the purchases and the customers', async () => {
      const { service } = createShop({
        arrivals: [
          [new Customer(1, Personality.GENEROUS, ESPRESSO)],
          [new Customer(2, Personality.RUSHED, LATTE)],
        ],
        coffeeUsed: 900,
        cashCents: 100000,
        draw: 0,
      });
      await service.advance(0.1);
      await service.advance(0.1);
      await service.advance(7);

      const [event] = await service.closeDay(1);

      expect(event).toEqual({
        type: 'day-report',
        report: {
          day: 1,
          salesCents: 520,
          tipsCents: 52,
          restockCostCents: 50000,
          profitCents: 520 + 52 - 50000,
          customersServed: 1,
          customersLostPatience: 1,
          customersLostOutOfStock: 0,
          averageSatisfactionPercent: 50,
          closingCashCents: 50572,
        },
      });
    });

    it('counts the customers turned away for a missing ingredient', async () => {
      const { service } = createShop({
        arrivals: [[new Customer(1, Personality.RELAXED, ESPRESSO)]],
        stock: { capacity: 1, threshold: 0 },
      });
      await service.advance(0.1);

      const [event] = await service.closeDay(1);

      expect(event).toMatchObject({ report: { customersLostOutOfStock: 1, customersServed: 0 } });
    });

    it('starts the next day from zero, and keeps the reports', async () => {
      const { service } = createShop({
        arrivals: [[new Customer(1, Personality.RELAXED, ESPRESSO)]],
      });
      await service.advance(0.1);
      await service.advance(2);
      await service.closeDay(1);

      await service.closeDay(2);

      const reports = await service.getReports();
      expect(reports.map((report) => [report.day, report.customersServed])).toEqual([
        [1, 1],
        [2, 0],
      ]);
      expect((await service.getSnapshot()).reports).toEqual(reports);
    });
  });
});

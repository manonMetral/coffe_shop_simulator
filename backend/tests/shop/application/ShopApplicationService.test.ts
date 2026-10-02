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
import { Server } from '../../../src/shop/domain/staff/Server.js';
import { ServerName } from '../../../src/shop/domain/staff/ServerName.js';
import { Staff } from '../../../src/shop/domain/staff/Staff.js';
import { InMemoryCashRegisterRepository } from '../../../src/shop/infrastructure/secondary/InMemoryCashRegisterRepository.js';
import { InMemoryCustomerQueueRepository } from '../../../src/shop/infrastructure/secondary/InMemoryCustomerQueueRepository.js';
import { InMemoryInventoryRepository } from '../../../src/shop/infrastructure/secondary/InMemoryInventoryRepository.js';
import { InMemoryMenuRepository } from '../../../src/shop/infrastructure/secondary/InMemoryMenuRepository.js';
import { InMemoryStaffRepository } from '../../../src/shop/infrastructure/secondary/InMemoryStaffRepository.js';
import { createTestMenu } from '../testMenu.js';

const { ESPRESSO, LATTE } = DrinkName;
const { COFFEE, MILK } = IngredientName;

interface Options {
  arrivals?: Customer[][];
  servers?: Server[];
  stock?: { capacity: number; threshold: number };
  draw?: number;
}

function createShop(options: Options = {}) {
  const arrivals = [...(options.arrivals ?? [])];
  const queue = new CustomerQueue();
  const staff = new Staff(options.servers ?? [new Server(ServerName.ALICE, 1, [ESPRESSO, LATTE])]);
  const stock = options.stock ?? { capacity: 1000, threshold: 100 };
  const service = new ShopApplicationService({
    queueRepository: new InMemoryCustomerQueueRepository(queue),
    staffRepository: new InMemoryStaffRepository(staff),
    cashRegisterRepository: new InMemoryCashRegisterRepository(
      new CashRegister(Money.ofCents(30000)),
    ),
    inventoryRepository: new InMemoryInventoryRepository(
      Inventory.full([COFFEE, MILK], stock.capacity, stock.threshold),
    ),
    menuRepository: new InMemoryMenuRepository(createTestMenu()),
    customerGenerator: { advance: () => arrivals.shift() ?? [] } as unknown as CustomerGenerator,
    orderDispatcher: new OrderDispatcher(),
    random: { next: () => options.draw ?? 0 },
  });
  return { service, queue, staff };
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

      expect(types(events)).toEqual(['customer-arrived', 'queue-updated', 'servers-updated']);
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
});

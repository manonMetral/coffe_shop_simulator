import { describe, expect, it } from 'vitest';
import { Customer } from '../../../../src/shop/domain/customer/Customer.js';
import { CustomerQueue } from '../../../../src/shop/domain/customer/CustomerQueue.js';
import { Personality } from '../../../../src/shop/domain/customer/Personality.js';
import { Inventory } from '../../../../src/shop/domain/inventory/Inventory.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';
import { IngredientName } from '../../../../src/shop/domain/menu/IngredientName.js';
import { OrderDispatcher } from '../../../../src/shop/domain/order/OrderDispatcher.js';
import { Server } from '../../../../src/shop/domain/staff/Server.js';
import { ServerName } from '../../../../src/shop/domain/staff/ServerName.js';
import { Staff } from '../../../../src/shop/domain/staff/Staff.js';
import { createTestMenu } from '../../testMenu.js';

const { ESPRESSO, LATTE } = DrinkName;
const menu = createTestMenu();

const alice = () => new Server(ServerName.ALICE, 1, [ESPRESSO, LATTE]);
const bob = () => new Server(ServerName.BOB, 2, [ESPRESSO]);
const chloe = () => new Server(ServerName.CHLOE, 0.5, [LATTE]);

const queueOf = (...customers: Customer[]) => {
  const queue = new CustomerQueue();
  customers.forEach((customer) => queue.enqueue(customer));
  return queue;
};

const fullInventory = () => Inventory.full([IngredientName.COFFEE, IngredientName.MILK], 1000, 100);

describe('OrderDispatcher', () => {
  it('gives a customer to the fastest idle server who masters the drink', () => {
    const queue = queueOf(new Customer(1, Personality.RELAXED, ESPRESSO));
    const staff = new Staff([alice(), bob(), chloe()]);

    const { started } = new OrderDispatcher().dispatch(queue, staff, menu, fullInventory());

    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ server: ServerName.BOB, preparationMinutes: 1 });
    expect(queue.customers()).toEqual([]);
  });

  it('prices the order with the margin of the menu', () => {
    const queue = queueOf(new Customer(1, Personality.RELAXED, LATTE));

    const { started } = new OrderDispatcher().dispatch(
      queue,
      new Staff([alice()]),
      menu,
      fullInventory(),
    );

    expect(started[0]?.price.cents).toBe(menu.priceOf(LATTE).cents);
  });

  it('serves first the customer who is about to lose patience, whatever the order of arrival', () => {
    const relaxed = new Customer(1, Personality.RELAXED, ESPRESSO);
    const rushed = new Customer(2, Personality.RUSHED, ESPRESSO);
    const queue = queueOf(relaxed, rushed);

    const { started } = new OrderDispatcher().dispatch(
      queue,
      new Staff([alice()]),
      menu,
      fullInventory(),
    );

    expect(started.map((order) => order.customer.id)).toEqual([2]);
    expect(queue.customers()).toEqual([relaxed]);
  });

  it('takes the time already waited into account to find the most urgent customer', () => {
    const waitedALot = new Customer(1, Personality.RELAXED, ESPRESSO);
    const justArrived = new Customer(2, Personality.DEMANDING, ESPRESSO);
    waitedALot.wait(20);

    const { started } = new OrderDispatcher().dispatch(
      queueOf(justArrived, waitedALot),
      new Staff([alice()]),
      menu,
      fullInventory(),
    );

    expect(started.map((order) => order.customer.id)).toEqual([1]);
  });

  it('keeps the customers who wait when no server is idle', () => {
    const queue = queueOf(new Customer(1, Personality.RUSHED, ESPRESSO));
    const busy = alice();
    busy.prepare(99, new Customer(99, Personality.RELAXED, ESPRESSO), menu.priceOf(ESPRESSO), 2);

    const { started, turnedAway } = new OrderDispatcher().dispatch(
      queue,
      new Staff([busy]),
      menu,
      fullInventory(),
    );

    expect(started).toEqual([]);
    expect(turnedAway).toEqual([]);
    expect(queue.customers()).toHaveLength(1);
  });

  it('serves the next customer when nobody idle masters the drink of the most urgent one', () => {
    const urgentLatte = new Customer(1, Personality.RUSHED, LATTE);
    const espresso = new Customer(2, Personality.RELAXED, ESPRESSO);
    const queue = queueOf(urgentLatte, espresso);

    const { started } = new OrderDispatcher().dispatch(
      queue,
      new Staff([bob()]),
      menu,
      fullInventory(),
    );

    expect(started.map((order) => order.customer.id)).toEqual([2]);
    expect(queue.customers()).toEqual([urgentLatte]);
  });

  it('uses each idle server only once', () => {
    const queue = queueOf(
      new Customer(1, Personality.RUSHED, ESPRESSO),
      new Customer(2, Personality.DEMANDING, ESPRESSO),
      new Customer(3, Personality.RELAXED, ESPRESSO),
    );

    const { started } = new OrderDispatcher().dispatch(
      queue,
      new Staff([alice(), bob()]),
      menu,
      fullInventory(),
    );

    expect(started.map((order) => order.server).sort()).toEqual([ServerName.ALICE, ServerName.BOB]);
    expect(queue.customers().map((customer) => customer.id)).toEqual([3]);
  });

  it('numbers the orders one after the other, also across several calls', () => {
    const dispatcher = new OrderDispatcher();
    const inventory = fullInventory();

    const first = dispatcher.dispatch(
      queueOf(new Customer(1, Personality.RUSHED, ESPRESSO)),
      new Staff([alice()]),
      menu,
      inventory,
    );
    const second = dispatcher.dispatch(
      queueOf(new Customer(2, Personality.RUSHED, ESPRESSO)),
      new Staff([bob()]),
      menu,
      inventory,
    );

    expect([first.started[0]?.id, second.started[0]?.id]).toEqual([1, 2]);
  });

  describe('stock', () => {
    it('consumes the ingredients of each drink it starts', () => {
      const inventory = fullInventory();

      new OrderDispatcher().dispatch(
        queueOf(new Customer(1, Personality.RUSHED, LATTE)),
        new Staff([alice()]),
        menu,
        inventory,
      );

      expect(inventory.quantityOf(IngredientName.COFFEE)).toBe(998);
      expect(inventory.quantityOf(IngredientName.MILK)).toBe(999);
    });

    it('reports the low stock alerts', () => {
      const inventory = Inventory.full([IngredientName.COFFEE, IngredientName.MILK], 102, 100);

      const { stockAlerts } = new OrderDispatcher().dispatch(
        queueOf(new Customer(1, Personality.RUSHED, ESPRESSO)),
        new Staff([alice()]),
        menu,
        inventory,
      );

      expect(stockAlerts).toEqual([{ ingredient: IngredientName.COFFEE, remaining: 100 }]);
    });

    it('turns away a customer when the ingredients of the drink are missing, without using a server', () => {
      const inventory = Inventory.full([IngredientName.COFFEE, IngredientName.MILK], 1, 0);
      const customer = new Customer(1, Personality.RUSHED, ESPRESSO);
      const queue = queueOf(customer);
      const staff = new Staff([alice()]);

      const { started, turnedAway } = new OrderDispatcher().dispatch(queue, staff, menu, inventory);

      expect(turnedAway).toEqual([customer]);
      expect(started).toEqual([]);
      expect(queue.customers()).toEqual([]);
      expect(staff.idleServers()).toHaveLength(1);
      expect(inventory.quantityOf(IngredientName.COFFEE)).toBe(1);
    });

    it('turns away a customer even when every server is busy', () => {
      const inventory = Inventory.full([IngredientName.COFFEE, IngredientName.MILK], 1, 0);
      const busy = alice();
      busy.prepare(1, new Customer(9, Personality.RELAXED, ESPRESSO), menu.priceOf(ESPRESSO), 2);

      const { turnedAway } = new OrderDispatcher().dispatch(
        queueOf(new Customer(1, Personality.RUSHED, ESPRESSO)),
        new Staff([busy]),
        menu,
        inventory,
      );

      expect(turnedAway).toHaveLength(1);
    });

    it('stops serving a drink as soon as the stock is used up by the previous customers', () => {
      const inventory = Inventory.full([IngredientName.COFFEE, IngredientName.MILK], 2, 0);
      const queue = queueOf(
        new Customer(1, Personality.RUSHED, ESPRESSO),
        new Customer(2, Personality.RELAXED, ESPRESSO),
      );

      const { started, turnedAway } = new OrderDispatcher().dispatch(
        queue,
        new Staff([alice(), bob()]),
        menu,
        inventory,
      );

      expect(started.map((order) => order.customer.id)).toEqual([1]);
      expect(turnedAway.map((customer) => customer.id)).toEqual([2]);
    });
  });
});

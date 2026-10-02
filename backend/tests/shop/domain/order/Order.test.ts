import { describe, expect, it } from 'vitest';
import { Customer } from '../../../../src/shop/domain/customer/Customer.js';
import { Personality } from '../../../../src/shop/domain/customer/Personality.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { Order } from '../../../../src/shop/domain/order/Order.js';
import { ServerName } from '../../../../src/shop/domain/staff/ServerName.js';

const newOrder = () =>
  new Order(
    1,
    new Customer(3, Personality.GENEROUS, DrinkName.LATTE),
    ServerName.CHLOE,
    Money.ofCents(780),
    4,
  );

describe('Order', () => {
  it('is the drink of a customer prepared by a server', () => {
    const order = newOrder();

    expect(order).toMatchObject({
      id: 1,
      server: ServerName.CHLOE,
      preparationMinutes: 4,
      drink: DrinkName.LATTE,
    });
    expect(order.price.cents).toBe(780);
    expect(order.customer.id).toBe(3);
  });

  it('is ready once the whole preparation time has gone by', () => {
    const order = newOrder();

    order.progress(3);
    expect(order.remainingMinutes).toBe(1);
    expect(order.isReady()).toBe(false);

    order.progress(1);
    expect(order.isReady()).toBe(true);
  });

  it('never has a negative remaining time', () => {
    const order = newOrder();

    order.progress(100);

    expect(order.remainingMinutes).toBe(0);
  });
});

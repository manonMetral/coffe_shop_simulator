import { describe, expect, it } from 'vitest';
import { Customer } from '../../../../src/shop/domain/customer/Customer.js';
import { Personality } from '../../../../src/shop/domain/customer/Personality.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';

const rushedCustomer = () => new Customer(1, Personality.RUSHED, DrinkName.ESPRESSO);

describe('Customer', () => {
  it('knows its personality, its favourite drink and the patience of its personality', () => {
    const customer = rushedCustomer();

    expect(customer.id).toBe(1);
    expect(customer.personality).toBe(Personality.RUSHED);
    expect(customer.drink).toBe(DrinkName.ESPRESSO);
    expect(customer.patienceMinutes).toBe(6);
    expect(customer.waitedMinutes).toBe(0);
  });

  it('accumulates the time it waits', () => {
    const customer = rushedCustomer();

    customer.wait(2);
    customer.wait(1.5);

    expect(customer.waitedMinutes).toBe(3.5);
  });

  it('loses patience exactly when it has waited as long as it accepts', () => {
    const customer = rushedCustomer();

    customer.wait(5.9);
    expect(customer.hasLostPatience()).toBe(false);
    customer.wait(0.1);
    expect(customer.hasLostPatience()).toBe(true);
  });

  it('gets more urgent as it waits', () => {
    const customer = rushedCustomer();
    expect(customer.remainingPatienceMinutes).toBe(6);

    customer.wait(4);

    expect(customer.remainingPatienceMinutes).toBe(2);
  });

  it.each([
    [0, 100],
    [3, 50],
    [4.5, 25],
    [6, 0],
    [20, 0],
  ])('after waiting %s minutes out of 6, the satisfaction is %s percent', (waited, expected) => {
    const customer = rushedCustomer();
    customer.wait(waited);

    expect(customer.satisfactionPercent()).toBe(expected);
  });
});

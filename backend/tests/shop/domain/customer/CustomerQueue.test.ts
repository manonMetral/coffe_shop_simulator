import { describe, expect, it } from 'vitest';
import { Customer } from '../../../../src/shop/domain/customer/Customer.js';
import { CustomerQueue } from '../../../../src/shop/domain/customer/CustomerQueue.js';
import { Personality } from '../../../../src/shop/domain/customer/Personality.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';

const rushed = (id: number) => new Customer(id, Personality.RUSHED, DrinkName.ESPRESSO);
const relaxed = (id: number) => new Customer(id, Personality.RELAXED, DrinkName.LATTE);

describe('CustomerQueue', () => {
  it('is empty at the start', () => {
    expect(new CustomerQueue().customers()).toEqual([]);
  });

  it('keeps the customers in order of arrival', () => {
    const queue = new CustomerQueue();
    const first = relaxed(1);
    const second = rushed(2);

    queue.enqueue(first);
    queue.enqueue(second);

    expect(queue.customers()).toEqual([first, second]);
  });

  it('does not let callers change the queue through the returned list', () => {
    const queue = new CustomerQueue();
    queue.enqueue(rushed(1));

    (queue.customers() as Customer[]).pop();

    expect(queue.customers()).toHaveLength(1);
  });

  it('makes everybody wait and returns only the customers who lost patience', () => {
    const queue = new CustomerQueue();
    const impatient = rushed(1);
    const patient = relaxed(2);
    queue.enqueue(impatient);
    queue.enqueue(patient);

    const left = queue.wait(7);

    expect(left).toEqual([impatient]);
    expect(queue.customers()).toEqual([patient]);
    expect(patient.waitedMinutes).toBe(7);
  });

  it('returns nobody while everybody is still patient', () => {
    const queue = new CustomerQueue();
    queue.enqueue(relaxed(1));

    expect(queue.wait(1)).toEqual([]);
  });

  it('removes a customer who is served', () => {
    const queue = new CustomerQueue();
    const first = relaxed(1);
    const second = relaxed(2);
    queue.enqueue(first);
    queue.enqueue(second);

    queue.remove(first);

    expect(queue.customers()).toEqual([second]);
  });
});

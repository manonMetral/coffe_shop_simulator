import { describe, expect, it } from 'vitest';
import { CustomerGenerator } from '../../../../src/shop/domain/customer/CustomerGenerator.js';
import { Personality } from '../../../../src/shop/domain/customer/Personality.js';
import type { RandomGenerator } from '../../../../src/shop/domain/customer/RandomGenerator.js';
import { InvalidCustomerFlowError } from '../../../../src/shop/domain/errors.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';
import { SeededRandomGenerator } from '../../../../src/shop/infrastructure/secondary/SeededRandomGenerator.js';

const drinks = [DrinkName.ESPRESSO, DrinkName.TEA, DrinkName.LATTE];

/** The random draw giving an arrival delay of `minutes` for 60 customers per hour. */
const drawFor = (minutes: number) => 1 - Math.exp(-minutes);

const scripted = (values: number[]): RandomGenerator => {
  const queue = [...values];
  return { next: () => queue.shift() ?? 0.5 };
};

describe('CustomerGenerator', () => {
  describe('creation', () => {
    it('needs drinks to choose from', () => {
      expect(() => new CustomerGenerator(scripted([]), [], 20)).toThrow(InvalidCustomerFlowError);
    });

    it.each([0, -3, Number.NaN, Number.POSITIVE_INFINITY])(
      'rejects the rate of %s customers per hour',
      (rate) => {
        expect(() => new CustomerGenerator(scripted([]), drinks, rate)).toThrow(
          InvalidCustomerFlowError,
        );
      },
    );
  });

  describe('arrivals', () => {
    it('makes nobody arrive before the delay is over, then makes a customer arrive', () => {
      const generator = new CustomerGenerator(scripted([drawFor(5)]), drinks, 60);

      expect(generator.advance(4)).toEqual([]);
      expect(generator.advance(1.5)).toHaveLength(1);
    });

    it('draws the personality and the drink of the arriving customer', () => {
      const random = scripted([drawFor(1), 0.3, 0.5, drawFor(10)]);
      const generator = new CustomerGenerator(random, drinks, 60);

      const [customer] = generator.advance(1.5);

      expect(customer).toMatchObject({
        id: 1,
        personality: Personality.RELAXED,
        drink: DrinkName.TEA,
      });
    });

    it.each([
      [0, Personality.RUSHED],
      [0.3, Personality.RELAXED],
      [0.6, Personality.DEMANDING],
      [0.99, Personality.GENEROUS],
    ])('turns the draw %s into the personality %s', (draw, personality) => {
      const generator = new CustomerGenerator(
        scripted([drawFor(1), draw, 0, drawFor(10)]),
        drinks,
        60,
      );

      expect(generator.advance(1.5)[0]?.personality).toBe(personality);
    });

    it('lets several customers arrive during a long period, numbered one after the other', () => {
      const generator = new CustomerGenerator(
        scripted([drawFor(1), 0, 0, drawFor(1), 0, 0, drawFor(1), 0, 0, drawFor(1)]),
        drinks,
        60,
      );

      const arrivals = generator.advance(3.5);

      expect(arrivals.map((customer) => customer.id)).toEqual([1, 2, 3]);
    });

    it('keeps the time already waited for the next customer between two calls', () => {
      const generator = new CustomerGenerator(
        scripted([drawFor(3), 0, 0, drawFor(10)]),
        drinks,
        60,
      );

      expect(generator.advance(1)).toEqual([]);
      expect(generator.advance(1)).toEqual([]);
      expect(generator.advance(1.5)).toHaveLength(1);
    });

    it('brings about the requested number of customers per hour on average', () => {
      const generator = new CustomerGenerator(new SeededRandomGenerator(7), drinks, 20);

      const arrivals = generator.advance(60 * 100);

      expect(arrivals.length / 100).toBeGreaterThan(18);
      expect(arrivals.length / 100).toBeLessThan(22);
    });

    it('produces the same customers for the same seed', () => {
      const describeCustomers = (seed: number) =>
        new CustomerGenerator(new SeededRandomGenerator(seed), drinks, 20)
          .advance(240)
          .map(({ id, personality, drink }) => ({ id, personality, drink }));

      expect(describeCustomers(3)).toEqual(describeCustomers(3));
      expect(describeCustomers(3)).not.toEqual(describeCustomers(4));
    });

    it('mixes every personality and every drink over a day', () => {
      const arrivals = new CustomerGenerator(new SeededRandomGenerator(11), drinks, 60).advance(
        60 * 24,
      );

      expect(new Set(arrivals.map((customer) => customer.personality)).size).toBe(4);
      expect(new Set(arrivals.map((customer) => customer.drink)).size).toBe(3);
    });
  });

  describe('arrival multiplier', () => {
    it('makes the customers arrive twice as often when it is 2', () => {
      const count = (multiplier: number) =>
        new CustomerGenerator(new SeededRandomGenerator(5), drinks, 20).advance(
          60 * 200,
          multiplier,
        ).length;

      const normal = count(1);
      const rush = count(2);

      expect(rush / normal).toBeGreaterThan(1.8);
      expect(rush / normal).toBeLessThan(2.2);
    });

    it('applies to the delay before the next arrival', () => {
      const generator = new CustomerGenerator(
        scripted([drawFor(6), 0, 0, drawFor(100)]),
        drinks,
        60,
      );

      expect(generator.advance(2, 2)).toEqual([]);
      expect(generator.advance(1, 2)).toHaveLength(1);
    });
  });
});

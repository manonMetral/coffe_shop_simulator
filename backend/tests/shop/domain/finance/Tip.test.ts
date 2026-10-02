import { describe, expect, it } from 'vitest';
import { Customer } from '../../../../src/shop/domain/customer/Customer.js';
import { Personality } from '../../../../src/shop/domain/customer/Personality.js';
import {
  MAX_TIP_PERCENT,
  MIN_TIP_PERCENT,
  tipFor,
} from '../../../../src/shop/domain/finance/Tip.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';
import { Money } from '../../../../src/shop/domain/Money.js';

const price = Money.ofCents(1000);
const customer = (personality: Personality) => new Customer(1, personality, DrinkName.LATTE);
const drawing = (value: number) => ({ next: () => value });

describe('tipFor', () => {
  it('goes from 10 to 20 percent', () => {
    expect([MIN_TIP_PERCENT, MAX_TIP_PERCENT]).toEqual([10, 20]);
  });

  it.each([Personality.RUSHED, Personality.RELAXED, Personality.DEMANDING])(
    'is nothing for a %s customer',
    (personality) => {
      expect(tipFor(customer(personality), price, drawing(0.5)).cents).toBe(0);
    },
  );

  it.each([
    [0, 100],
    [0.5, 150],
    [0.999, 200],
  ])('depends on the draw %s for a generous customer', (draw, expectedCents) => {
    expect(tipFor(customer(Personality.GENEROUS), price, drawing(draw)).cents).toBe(expectedCents);
  });

  it('is rounded to the nearest cent', () => {
    expect(tipFor(customer(Personality.GENEROUS), Money.ofCents(585), drawing(0)).cents).toBe(59);
  });
});

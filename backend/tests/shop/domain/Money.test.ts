import { describe, expect, it } from 'vitest';
import { InvalidMoneyError } from '../../../src/shop/domain/errors.js';
import { Money } from '../../../src/shop/domain/Money.js';

describe('Money', () => {
  it('holds an amount in cents', () => {
    expect(Money.ofCents(250).cents).toBe(250);
  });

  it.each([-1, 1.5, Number.NaN])('rejects %s cents', (cents) => {
    expect(() => Money.ofCents(cents)).toThrow(InvalidMoneyError);
  });

  it('adds amounts', () => {
    expect(Money.ofCents(200).plus(Money.ofCents(50)).cents).toBe(250);
  });

  it('multiplies by a quantity', () => {
    expect(Money.ofCents(200).times(3).cents).toBe(600);
  });

  it.each([-1, 0.5])('rejects the quantity %s', (quantity) => {
    expect(() => Money.ofCents(200).times(quantity)).toThrow(InvalidMoneyError);
  });

  it('applies a margin in percent', () => {
    expect(Money.ofCents(400).withMargin(30).cents).toBe(520);
  });

  it('rounds the margin to the nearest cent', () => {
    expect(Money.ofCents(333).withMargin(30).cents).toBe(433);
  });
});

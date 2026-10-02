import { describe, expect, it } from 'vitest';
import { IngredientName } from '../../../../src/shop/domain/menu/IngredientName.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { Restock } from '../../../../src/shop/domain/restock/Restock.js';

const newRestock = () => new Restock(IngredientName.COFFEE, 250, Money.ofCents(50000), 60);

describe('Restock', () => {
  it('is what was bought, and the time before it arrives', () => {
    const restock = newRestock();

    expect(restock).toMatchObject({
      ingredient: IngredientName.COFFEE,
      quantity: 250,
      remainingMinutes: 60,
    });
    expect(restock.cost.cents).toBe(50000);
    expect(restock.isDelivered()).toBe(false);
  });

  it('arrives once the whole delay has gone by, and never before', () => {
    const restock = newRestock();

    restock.progress(59);
    expect(restock.isDelivered()).toBe(false);
    restock.progress(1);
    expect(restock.isDelivered()).toBe(true);
  });

  it('never has a negative remaining time', () => {
    const restock = newRestock();

    restock.progress(500);

    expect(restock.remainingMinutes).toBe(0);
  });
});

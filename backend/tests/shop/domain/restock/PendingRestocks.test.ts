import { describe, expect, it } from 'vitest';
import { InvalidRestockError } from '../../../../src/shop/domain/errors.js';
import { IngredientName } from '../../../../src/shop/domain/menu/IngredientName.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { PendingRestocks } from '../../../../src/shop/domain/restock/PendingRestocks.js';
import { Restock } from '../../../../src/shop/domain/restock/Restock.js';

const restock = (ingredient: IngredientName, delay: number) =>
  new Restock(ingredient, 100, Money.ofCents(20000), delay);

describe('PendingRestocks', () => {
  it('is empty at the start', () => {
    const pending = new PendingRestocks();

    expect(pending.restocks()).toEqual([]);
    expect(pending.ingredients().size).toBe(0);
  });

  it('knows which ingredients are on their way', () => {
    const pending = new PendingRestocks();
    pending.add(restock(IngredientName.COFFEE, 60));
    pending.add(restock(IngredientName.MILK, 60));

    expect([...pending.ingredients()]).toEqual([IngredientName.COFFEE, IngredientName.MILK]);
  });

  it('refuses to order an ingredient that is already on its way', () => {
    const pending = new PendingRestocks();
    pending.add(restock(IngredientName.COFFEE, 60));

    expect(() => pending.add(restock(IngredientName.COFFEE, 60))).toThrow(InvalidRestockError);
  });

  it('returns the restocks that arrive, and keeps the others', () => {
    const pending = new PendingRestocks();
    const soon = restock(IngredientName.COFFEE, 30);
    const later = restock(IngredientName.MILK, 90);
    pending.add(soon);
    pending.add(later);

    expect(pending.advance(30)).toEqual([soon]);
    expect(pending.restocks()).toEqual([later]);
    expect(pending.advance(60)).toEqual([later]);
    expect(pending.restocks()).toEqual([]);
  });

  it('lets an ingredient be ordered again once it is delivered', () => {
    const pending = new PendingRestocks();
    pending.add(restock(IngredientName.COFFEE, 10));
    pending.advance(10);

    expect(() => pending.add(restock(IngredientName.COFFEE, 10))).not.toThrow();
  });
});

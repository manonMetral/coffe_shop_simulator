import { describe, expect, it } from 'vitest';
import { DrinkName } from '../../src/shop/domain/menu/DrinkName.js';
import { IngredientName } from '../../src/shop/domain/menu/IngredientName.js';
import { createDefaultMenu } from '../../src/composition/defaultMenu.js';

describe('default menu', () => {
  const menu = createDefaultMenu();

  it('offers 3 drinks made from 4 ingredients', () => {
    expect(menu.drinks().map((drink) => drink.name)).toEqual([
      DrinkName.ESPRESSO,
      DrinkName.TEA,
      DrinkName.LATTE,
    ]);
    expect(menu.ingredients().map((ingredient) => ingredient.name)).toEqual([
      IngredientName.COFFEE,
      IngredientName.MILK,
      IngredientName.TEA,
      IngredientName.WATER,
    ]);
  });

  it('buys every ingredient between 2 and 4 EUR per unit', () => {
    for (const { unitPrice } of menu.ingredients()) {
      expect(unitPrice.cents).toBeGreaterThanOrEqual(200);
      expect(unitPrice.cents).toBeLessThanOrEqual(400);
    }
  });

  it.each([
    [DrinkName.ESPRESSO, 600, 780],
    [DrinkName.TEA, 450, 585],
    [DrinkName.LATTE, 600, 780],
  ])('sells %s with a 30 %% margin (cost %i, price %i cents)', (drink, cost, price) => {
    expect(menu.costOf(drink).cents).toBe(cost);
    expect(menu.priceOf(drink).cents).toBe(price);
    expect(menu.priceOf(drink).cents).toBe(Math.round(cost * 1.3));
  });
});

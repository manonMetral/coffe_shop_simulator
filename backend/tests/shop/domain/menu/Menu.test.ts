import { describe, expect, it } from 'vitest';
import {
  InvalidMenuError,
  UnknownDrinkError,
  UnknownIngredientError,
} from '../../../../src/shop/domain/errors.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';
import { IngredientName } from '../../../../src/shop/domain/menu/IngredientName.js';
import { Menu, PROFIT_MARGIN_PERCENT } from '../../../../src/shop/domain/menu/Menu.js';
import { Recipe } from '../../../../src/shop/domain/menu/Recipe.js';
import { coffee, createTestMenu, espresso, latte, milk } from '../../testMenu.js';

describe('Menu', () => {
  it('lists its ingredients and drinks', () => {
    const menu = createTestMenu();

    expect(menu.ingredients()).toEqual([coffee, milk]);
    expect(menu.drinks()).toEqual([espresso, latte]);
  });

  it('finds an ingredient and a drink by name', () => {
    const menu = createTestMenu();

    expect(menu.ingredient(IngredientName.MILK)).toBe(milk);
    expect(menu.drink(DrinkName.LATTE)).toBe(latte);
  });

  it('rejects an ingredient or a drink that is not on the menu', () => {
    const menu = createTestMenu();

    expect(() => menu.ingredient(IngredientName.TEA)).toThrow(UnknownIngredientError);
    expect(() => menu.drink(DrinkName.TEA)).toThrow(UnknownDrinkError);
  });

  it('rejects duplicated ingredients', () => {
    expect(() => new Menu([coffee, coffee], [])).toThrow(InvalidMenuError);
  });

  it('rejects duplicated drinks', () => {
    expect(() => new Menu([coffee], [espresso, espresso])).toThrow(InvalidMenuError);
  });

  it('rejects a drink using an ingredient that is not on the menu', () => {
    const tea = {
      name: DrinkName.TEA,
      recipe: new Recipe([{ ingredient: IngredientName.TEA, quantity: 1 }]),
      preparationMinutes: 3,
    };

    expect(() => new Menu([coffee], [tea])).toThrow(UnknownIngredientError);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects a preparation time of %s minutes',
    (minutes) => {
      const tooQuick = { ...espresso, preparationMinutes: minutes };

      expect(() => new Menu([coffee], [tooQuick])).toThrow(InvalidMenuError);
    },
  );

  it('computes the cost of a drink from its recipe', () => {
    const menu = createTestMenu();

    expect(menu.costOf(DrinkName.ESPRESSO).cents).toBe(400);
    expect(menu.costOf(DrinkName.LATTE).cents).toBe(550);
  });

  it('sells every drink with a 30 % margin on its cost', () => {
    const menu = createTestMenu();

    expect(PROFIT_MARGIN_PERCENT).toBe(30);
    expect(menu.priceOf(DrinkName.ESPRESSO).cents).toBe(520);
    expect(menu.priceOf(DrinkName.LATTE).cents).toBe(715);
  });

  it('prices a drink higher when its recipe holds more ingredients', () => {
    const menu = createTestMenu();

    expect(menu.priceOf(DrinkName.LATTE).cents).toBeGreaterThan(
      menu.priceOf(DrinkName.ESPRESSO).cents,
    );
  });
});

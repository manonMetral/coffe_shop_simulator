import { describe, expect, it } from 'vitest';
import { InvalidRecipeError } from '../../../../src/shop/domain/errors.js';
import { IngredientName } from '../../../../src/shop/domain/menu/IngredientName.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { Recipe } from '../../../../src/shop/domain/menu/Recipe.js';

describe('Recipe', () => {
  it('rejects an empty recipe', () => {
    expect(() => new Recipe([])).toThrow(InvalidRecipeError);
  });

  it.each([0, -1, 1.5])('rejects the quantity %s', (quantity) => {
    expect(() => new Recipe([{ ingredient: IngredientName.COFFEE, quantity }])).toThrow(
      InvalidRecipeError,
    );
  });

  it('rejects a duplicated ingredient', () => {
    expect(
      () =>
        new Recipe([
          { ingredient: IngredientName.COFFEE, quantity: 1 },
          { ingredient: IngredientName.COFFEE, quantity: 2 },
        ]),
    ).toThrow('Duplicate ingredient in recipe: Café');
  });

  it('keeps its own copy of the items', () => {
    const items = [{ ingredient: IngredientName.COFFEE, quantity: 2 }];

    const recipe = new Recipe(items);
    items[0] = { ingredient: IngredientName.MILK, quantity: 9 };

    expect(recipe.items).toEqual([{ ingredient: IngredientName.COFFEE, quantity: 2 }]);
  });

  it('costs the sum of quantity x unit price', () => {
    const recipe = new Recipe([
      { ingredient: IngredientName.COFFEE, quantity: 2 },
      { ingredient: IngredientName.MILK, quantity: 1 },
    ]);
    const prices = { [IngredientName.COFFEE]: 200, [IngredientName.MILK]: 150 } as Record<
      IngredientName,
      number
    >;

    expect(recipe.cost((ingredient) => Money.ofCents(prices[ingredient])).cents).toBe(550);
  });
});

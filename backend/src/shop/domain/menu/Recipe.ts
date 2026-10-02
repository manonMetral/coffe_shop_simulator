import { InvalidRecipeError } from '../errors.js';
import { Money } from '../Money.js';
import type { IngredientName } from './IngredientName.js';

export interface RecipeItem {
  readonly ingredient: IngredientName;
  readonly quantity: number;
}

export class Recipe {
  readonly items: readonly RecipeItem[];

  constructor(items: readonly RecipeItem[]) {
    if (items.length === 0) {
      throw new InvalidRecipeError('A recipe needs at least one ingredient');
    }
    const seen = new Set<IngredientName>();
    for (const { ingredient, quantity } of items) {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new InvalidRecipeError(`Invalid quantity for ${ingredient}: ${quantity}`);
      }
      if (seen.has(ingredient)) {
        throw new InvalidRecipeError(`Duplicate ingredient in recipe: ${ingredient}`);
      }
      seen.add(ingredient);
    }
    this.items = items.map((item) => ({ ...item }));
  }

  cost(unitPriceOf: (ingredient: IngredientName) => Money): Money {
    return this.items.reduce(
      (total, { ingredient, quantity }) => total.plus(unitPriceOf(ingredient).times(quantity)),
      Money.ofCents(0),
    );
  }
}

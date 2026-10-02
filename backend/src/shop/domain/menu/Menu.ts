import { InvalidMenuError, UnknownDrinkError, UnknownIngredientError } from '../errors.js';
import type { Money } from '../Money.js';
import type { Drink } from './Drink.js';
import type { DrinkName } from './DrinkName.js';
import type { Ingredient } from './Ingredient.js';
import type { IngredientName } from './IngredientName.js';

/** Profit margin applied on the cost price of every drink. */
export const PROFIT_MARGIN_PERCENT = 30;

export class Menu {
  private readonly ingredientsByName = new Map<IngredientName, Ingredient>();
  private readonly drinksByName = new Map<DrinkName, Drink>();

  constructor(ingredients: readonly Ingredient[], drinks: readonly Drink[]) {
    for (const ingredient of ingredients) {
      if (this.ingredientsByName.has(ingredient.name)) {
        throw new InvalidMenuError(`Duplicate ingredient: ${ingredient.name}`);
      }
      this.ingredientsByName.set(ingredient.name, ingredient);
    }
    for (const drink of drinks) {
      if (this.drinksByName.has(drink.name)) {
        throw new InvalidMenuError(`Duplicate drink: ${drink.name}`);
      }
      for (const { ingredient } of drink.recipe.items) {
        this.ingredient(ingredient);
      }
      this.drinksByName.set(drink.name, drink);
    }
  }

  ingredients(): Ingredient[] {
    return [...this.ingredientsByName.values()];
  }

  drinks(): Drink[] {
    return [...this.drinksByName.values()];
  }

  ingredient(name: IngredientName): Ingredient {
    const ingredient = this.ingredientsByName.get(name);
    if (!ingredient) {
      throw new UnknownIngredientError(name);
    }
    return ingredient;
  }

  drink(name: DrinkName): Drink {
    const drink = this.drinksByName.get(name);
    if (!drink) {
      throw new UnknownDrinkError(name);
    }
    return drink;
  }

  costOf(name: DrinkName): Money {
    return this.drink(name).recipe.cost((ingredient) => this.ingredient(ingredient).unitPrice);
  }

  priceOf(name: DrinkName): Money {
    return this.costOf(name).withMargin(PROFIT_MARGIN_PERCENT);
  }
}

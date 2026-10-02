import { Money } from '../../src/shop/domain/Money.js';
import { DrinkName } from '../../src/shop/domain/menu/DrinkName.js';
import { IngredientName } from '../../src/shop/domain/menu/IngredientName.js';
import { Menu } from '../../src/shop/domain/menu/Menu.js';
import { Recipe } from '../../src/shop/domain/menu/Recipe.js';

export const coffee = { name: IngredientName.COFFEE, unitPrice: Money.ofCents(200) };
export const milk = { name: IngredientName.MILK, unitPrice: Money.ofCents(150) };

export const espressoRecipe = new Recipe([{ ingredient: IngredientName.COFFEE, quantity: 2 }]);
export const latteRecipe = new Recipe([
  { ingredient: IngredientName.COFFEE, quantity: 2 },
  { ingredient: IngredientName.MILK, quantity: 1 },
]);

export const espresso = { name: DrinkName.ESPRESSO, recipe: espressoRecipe, preparationMinutes: 2 };
export const latte = { name: DrinkName.LATTE, recipe: latteRecipe, preparationMinutes: 4 };

export function createTestMenu(): Menu {
  return new Menu([coffee, milk], [espresso, latte]);
}

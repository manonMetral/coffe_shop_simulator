import { Money } from '../../domain/Money.js';
import type { Drink } from '../../domain/menu/Drink.js';
import { DrinkName } from '../../domain/menu/DrinkName.js';
import type { Ingredient } from '../../domain/menu/Ingredient.js';
import { IngredientName } from '../../domain/menu/IngredientName.js';
import { Menu } from '../../domain/menu/Menu.js';
import { Recipe } from '../../domain/menu/Recipe.js';

const ingredients: Ingredient[] = [
  { name: IngredientName.COFFEE, unitPrice: Money.ofCents(200) },
  { name: IngredientName.MILK, unitPrice: Money.ofCents(200) },
  { name: IngredientName.TEA, unitPrice: Money.ofCents(250) },
  { name: IngredientName.WATER, unitPrice: Money.ofCents(200) },
];

const drinks: Drink[] = [
  {
    name: DrinkName.ESPRESSO,
    recipe: new Recipe([
      { ingredient: IngredientName.COFFEE, quantity: 2 },
      { ingredient: IngredientName.WATER, quantity: 1 },
    ]),
  },
  {
    name: DrinkName.TEA,
    recipe: new Recipe([
      { ingredient: IngredientName.TEA, quantity: 1 },
      { ingredient: IngredientName.WATER, quantity: 1 },
    ]),
  },
  {
    name: DrinkName.LATTE,
    recipe: new Recipe([
      { ingredient: IngredientName.COFFEE, quantity: 2 },
      { ingredient: IngredientName.MILK, quantity: 1 },
    ]),
  },
];

export function createDefaultMenu(): Menu {
  return new Menu(ingredients, drinks);
}

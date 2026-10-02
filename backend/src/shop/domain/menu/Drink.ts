import type { DrinkName } from './DrinkName.js';
import type { Recipe } from './Recipe.js';

export interface Drink {
  readonly name: DrinkName;
  readonly recipe: Recipe;
}

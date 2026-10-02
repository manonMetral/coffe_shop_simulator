import type { Money } from '../Money.js';
import type { IngredientName } from './IngredientName.js';

export interface Ingredient {
  readonly name: IngredientName;
  readonly unitPrice: Money;
}

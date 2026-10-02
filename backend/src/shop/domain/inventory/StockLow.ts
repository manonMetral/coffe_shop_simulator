import type { IngredientName } from '../menu/IngredientName.js';

/** Raised when the stock of an ingredient reaches the alert threshold. */
export interface StockLow {
  readonly ingredient: IngredientName;
  readonly remaining: number;
}

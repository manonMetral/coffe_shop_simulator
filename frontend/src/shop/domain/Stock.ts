export type IngredientName = 'Café' | 'Lait' | 'Thé' | 'Eau';

export interface StockLevel {
  readonly ingredient: IngredientName;
  readonly quantity: number;
  readonly capacity: number;
  /** True when the stock reached the alert threshold. */
  readonly low: boolean;
}

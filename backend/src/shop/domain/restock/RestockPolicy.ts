import type { Inventory } from '../inventory/Inventory.js';
import type { Ingredient } from '../menu/Ingredient.js';
import type { IngredientName } from '../menu/IngredientName.js';
import type { Money } from '../Money.js';

export const MIN_RESTOCK_UNITS = 100;
export const MAX_RESTOCK_UNITS = 1000;

export interface RestockOrder {
  readonly ingredient: IngredientName;
  readonly quantity: number;
  readonly cost: Money;
}

/**
 * Decides what to buy when the stock is low.
 * The cash is shared equally between the ingredients of the menu, whether they are low or not.
 * An order is between 100 and 1000 units, within the budget of the ingredient and the room in the stock;
 * below 100 units nothing is bought, and the purchase is tried again when there is more cash.
 */
export function planRestocks(
  cash: Money,
  ingredients: readonly Ingredient[],
  inventory: Inventory,
  alreadyOrdered: ReadonlySet<IngredientName>,
): RestockOrder[] {
  const budgetCents = Math.floor(cash.cents / ingredients.length);
  const orders: RestockOrder[] = [];

  for (const { name, unitPrice } of ingredients) {
    if (!inventory.isLow(name) || alreadyOrdered.has(name)) {
      continue;
    }
    const affordable = Math.floor(budgetCents / unitPrice.cents);
    const quantity = Math.min(MAX_RESTOCK_UNITS, inventory.spaceLeft(name), affordable);
    if (quantity >= MIN_RESTOCK_UNITS) {
      orders.push({ ingredient: name, quantity, cost: unitPrice.times(quantity) });
    }
  }
  return orders;
}

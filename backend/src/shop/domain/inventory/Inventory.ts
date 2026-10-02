import {
  InsufficientStockError,
  InvalidInventoryError,
  UnknownIngredientError,
} from '../errors.js';
import type { IngredientName } from '../menu/IngredientName.js';
import type { Recipe } from '../menu/Recipe.js';
import type { StockLow } from './StockLow.js';

export interface StockLevel {
  readonly ingredient: IngredientName;
  readonly quantity: number;
}

export class Inventory {
  private constructor(
    private readonly quantities: Map<IngredientName, number>,
    readonly capacity: number,
    readonly alertThreshold: number,
  ) {}

  /** Creates an inventory where every ingredient is at full capacity. */
  static full(
    ingredients: readonly IngredientName[],
    capacity: number,
    alertThreshold: number,
  ): Inventory {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new InvalidInventoryError(`Invalid capacity: ${capacity}`);
    }
    if (!Number.isInteger(alertThreshold) || alertThreshold < 0 || alertThreshold >= capacity) {
      throw new InvalidInventoryError(`Invalid alert threshold: ${alertThreshold}`);
    }
    const quantities = new Map(ingredients.map((ingredient) => [ingredient, capacity]));
    return new Inventory(quantities, capacity, alertThreshold);
  }

  levels(): StockLevel[] {
    return [...this.quantities].map(([ingredient, quantity]) => ({ ingredient, quantity }));
  }

  quantityOf(ingredient: IngredientName): number {
    const quantity = this.quantities.get(ingredient);
    if (quantity === undefined) {
      throw new UnknownIngredientError(ingredient);
    }
    return quantity;
  }

  /** How many units can still be stored before the ingredient is at full capacity. */
  spaceLeft(ingredient: IngredientName): number {
    return this.capacity - this.quantityOf(ingredient);
  }

  /** Adds delivered units to the stock, which cannot exceed the capacity. */
  restock(ingredient: IngredientName, quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidInventoryError(`Invalid quantity to restock: ${quantity}`);
    }
    if (quantity > this.spaceLeft(ingredient)) {
      throw new InvalidInventoryError(
        `Not enough room to store ${quantity} units of ${ingredient}`,
      );
    }
    this.quantities.set(ingredient, this.quantityOf(ingredient) + quantity);
  }

  isLow(ingredient: IngredientName): boolean {
    return this.quantityOf(ingredient) <= this.alertThreshold;
  }

  canPrepare(recipe: Recipe): boolean {
    return recipe.items.every(
      ({ ingredient, quantity }) => this.quantityOf(ingredient) >= quantity,
    );
  }

  /**
   * Consumes the ingredients of a recipe.
   * Returns an alert for each ingredient whose stock just reached the alert threshold.
   */
  consume(recipe: Recipe): StockLow[] {
    for (const { ingredient, quantity } of recipe.items) {
      const available = this.quantityOf(ingredient);
      if (available < quantity) {
        throw new InsufficientStockError(ingredient, quantity, available);
      }
    }

    const alerts: StockLow[] = [];
    for (const { ingredient, quantity } of recipe.items) {
      const before = this.quantityOf(ingredient);
      const remaining = before - quantity;
      this.quantities.set(ingredient, remaining);
      if (before > this.alertThreshold && remaining <= this.alertThreshold) {
        alerts.push({ ingredient, remaining });
      }
    }
    return alerts;
  }
}

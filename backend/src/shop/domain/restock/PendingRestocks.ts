import { InvalidRestockError } from '../errors.js';
import type { IngredientName } from '../menu/IngredientName.js';
import type { Restock } from './Restock.js';

/** The restocks that were ordered and are not delivered yet. */
export class PendingRestocks {
  private ordered: Restock[] = [];

  restocks(): readonly Restock[] {
    return [...this.ordered];
  }

  ingredients(): ReadonlySet<IngredientName> {
    return new Set(this.ordered.map((restock) => restock.ingredient));
  }

  add(restock: Restock): void {
    if (this.ingredients().has(restock.ingredient)) {
      throw new InvalidRestockError(`${restock.ingredient} is already being delivered`);
    }
    this.ordered.push(restock);
  }

  /** Lets the time go by and returns the restocks that arrive. */
  advance(minutes: number): Restock[] {
    for (const restock of this.ordered) {
      restock.progress(minutes);
    }
    const delivered = this.ordered.filter((restock) => restock.isDelivered());
    this.ordered = this.ordered.filter((restock) => !restock.isDelivered());
    return delivered;
  }
}

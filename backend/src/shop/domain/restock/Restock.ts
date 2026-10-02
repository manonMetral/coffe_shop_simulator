import type { IngredientName } from '../menu/IngredientName.js';
import type { Money } from '../Money.js';

/** Units of an ingredient that were bought and are on their way to the shop. */
export class Restock {
  private remaining: number;

  constructor(
    readonly ingredient: IngredientName,
    readonly quantity: number,
    readonly cost: Money,
    deliveryMinutes: number,
  ) {
    this.remaining = deliveryMinutes;
  }

  get remainingMinutes(): number {
    return this.remaining;
  }

  /** Lets the delivery go forward, in simulated minutes. */
  progress(minutes: number): void {
    this.remaining = Math.max(0, this.remaining - minutes);
  }

  isDelivered(): boolean {
    return this.remaining === 0;
  }
}

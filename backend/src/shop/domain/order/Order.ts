import type { Customer } from '../customer/Customer.js';
import type { DrinkName } from '../menu/DrinkName.js';
import type { Money } from '../Money.js';
import type { ServerName } from '../staff/ServerName.js';

/** The preparation of a drink for a customer by a server. */
export class Order {
  private remaining: number;

  constructor(
    readonly id: number,
    readonly customer: Customer,
    readonly server: ServerName,
    readonly price: Money,
    readonly preparationMinutes: number,
  ) {
    this.remaining = preparationMinutes;
  }

  get drink(): DrinkName {
    return this.customer.drink;
  }

  get remainingMinutes(): number {
    return this.remaining;
  }

  /** Lets the preparation go forward, in simulated minutes. */
  progress(minutes: number): void {
    this.remaining = Math.max(0, this.remaining - minutes);
  }

  isReady(): boolean {
    return this.remaining === 0;
  }
}

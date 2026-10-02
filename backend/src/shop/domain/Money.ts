import { InvalidMoneyError } from './errors.js';

/** Amount of money in cents, to avoid floating point errors. */
export class Money {
  private constructor(readonly cents: number) {}

  static ofCents(cents: number): Money {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new InvalidMoneyError(`Invalid amount of cents: ${cents}`);
    }
    return new Money(cents);
  }

  plus(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  minus(other: Money): Money {
    return Money.ofCents(this.cents - other.cents);
  }

  times(quantity: number): Money {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new InvalidMoneyError(`Invalid quantity: ${quantity}`);
    }
    return new Money(this.cents * quantity);
  }

  /** The given percentage of this amount, rounded to the nearest cent. */
  percent(percent: number): Money {
    return Money.ofCents(Math.round((this.cents * percent) / 100));
  }

  /** Adds a margin expressed as a percentage of this amount, rounded to the nearest cent. */
  withMargin(percent: number): Money {
    return Money.ofCents(Math.round((this.cents * (100 + percent)) / 100));
  }
}

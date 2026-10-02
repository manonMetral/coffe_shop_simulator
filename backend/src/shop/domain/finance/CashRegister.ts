import type { Money } from '../Money.js';

export class CashRegister {
  constructor(private readonly currentBalance: Money) {}

  balance(): Money {
    return this.currentBalance;
  }
}

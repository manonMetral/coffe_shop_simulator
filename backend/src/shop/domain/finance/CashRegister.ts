import { InsufficientFundsError } from '../errors.js';
import type { Money } from '../Money.js';

export class CashRegister {
  private currentBalance: Money;

  constructor(balance: Money) {
    this.currentBalance = balance;
  }

  balance(): Money {
    return this.currentBalance;
  }

  deposit(amount: Money): void {
    this.currentBalance = this.currentBalance.plus(amount);
  }

  /** Pays an amount out of the cash register, which can never be overdrawn. */
  withdraw(amount: Money): void {
    if (amount.cents > this.currentBalance.cents) {
      throw new InsufficientFundsError(amount.cents, this.currentBalance.cents);
    }
    this.currentBalance = this.currentBalance.minus(amount);
  }
}

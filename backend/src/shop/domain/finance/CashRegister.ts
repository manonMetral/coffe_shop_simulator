import { Money } from '../Money.js';

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
}

import { describe, expect, it } from 'vitest';
import { InsufficientFundsError } from '../../../../src/shop/domain/errors.js';
import { CashRegister } from '../../../../src/shop/domain/finance/CashRegister.js';
import { Money } from '../../../../src/shop/domain/Money.js';

describe('CashRegister', () => {
  it('holds its balance', () => {
    expect(new CashRegister(Money.ofCents(30000)).balance().cents).toBe(30000);
  });

  it('grows with every deposit', () => {
    const cashRegister = new CashRegister(Money.ofCents(30000));

    cashRegister.deposit(Money.ofCents(520));
    cashRegister.deposit(Money.ofCents(80));

    expect(cashRegister.balance().cents).toBe(30600);
  });

  it('pays out an amount, down to an empty cash register', () => {
    const cashRegister = new CashRegister(Money.ofCents(1000));

    cashRegister.withdraw(Money.ofCents(400));
    cashRegister.withdraw(Money.ofCents(600));

    expect(cashRegister.balance().cents).toBe(0);
  });

  it('can never be overdrawn', () => {
    const cashRegister = new CashRegister(Money.ofCents(1000));

    expect(() => cashRegister.withdraw(Money.ofCents(1001))).toThrow(InsufficientFundsError);
    expect(cashRegister.balance().cents).toBe(1000);
  });
});

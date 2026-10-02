import { describe, expect, it } from 'vitest';
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
});

import { describe, expect, it } from 'vitest';
import { CashRegister } from '../../../../src/shop/domain/finance/CashRegister.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { InMemoryCashRegisterRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryCashRegisterRepository.js';

describe('InMemoryCashRegisterRepository', () => {
  it('returns the cash register it was created with', async () => {
    const cashRegister = new CashRegister(Money.ofCents(100));

    expect(await new InMemoryCashRegisterRepository(cashRegister).get()).toBe(cashRegister);
  });
});

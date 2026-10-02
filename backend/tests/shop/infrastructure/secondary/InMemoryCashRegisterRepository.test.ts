import { describe, expect, it } from 'vitest';
import { CashRegister } from '../../../../src/shop/domain/finance/CashRegister.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { InMemoryCashRegisterRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryCashRegisterRepository.js';

describe('InMemoryCashRegisterRepository', () => {
  it('returns the cash register it was created with', async () => {
    const cashRegister = new CashRegister(Money.ofCents(100));

    expect(await new InMemoryCashRegisterRepository(cashRegister).get()).toBe(cashRegister);
  });

  it('replaces the cash register on save', async () => {
    const repository = new InMemoryCashRegisterRepository(new CashRegister(Money.ofCents(100)));
    const other = new CashRegister(Money.ofCents(200));

    await repository.save(other);

    expect(await repository.get()).toBe(other);
  });
});

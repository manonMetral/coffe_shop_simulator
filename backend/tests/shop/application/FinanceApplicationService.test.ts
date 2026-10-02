import { describe, expect, it } from 'vitest';
import { FinanceApplicationService } from '../../../src/shop/application/FinanceApplicationService.js';
import { CashRegister } from '../../../src/shop/domain/finance/CashRegister.js';
import { Money } from '../../../src/shop/domain/Money.js';
import { InMemoryCashRegisterRepository } from '../../../src/shop/infrastructure/secondary/InMemoryCashRegisterRepository.js';

describe('FinanceApplicationService', () => {
  it('returns the balance of the cash register', async () => {
    const repository = new InMemoryCashRegisterRepository(new CashRegister(Money.ofCents(12345)));

    expect(await new FinanceApplicationService(repository).getBalance()).toEqual({
      balanceCents: 12345,
    });
  });
});

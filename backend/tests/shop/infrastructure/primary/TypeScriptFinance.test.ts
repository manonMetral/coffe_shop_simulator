import { describe, expect, it } from 'vitest';
import { TypeScriptFinance } from '../../../../src/shop/infrastructure/primary/TypeScriptFinance.js';
import { FinanceApplicationService } from '../../../../src/shop/application/FinanceApplicationService.js';
import { CashRegister } from '../../../../src/shop/domain/finance/CashRegister.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { InMemoryCashRegisterRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryCashRegisterRepository.js';

describe('TypeScriptFinance', () => {
  it('exposes the balance in cents to the other contexts', async () => {
    const repository = new InMemoryCashRegisterRepository(new CashRegister(Money.ofCents(500)));

    expect(
      await new TypeScriptFinance(new FinanceApplicationService(repository)).balanceCents(),
    ).toBe(500);
  });
});

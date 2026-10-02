import { describe, expect, it } from 'vitest';
import { Ledger } from '../../../../src/shop/domain/report/Ledger.js';
import { InMemoryLedgerRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryLedgerRepository.js';

describe('InMemoryLedgerRepository', () => {
  it('returns the ledger it was created with', async () => {
    const ledger = new Ledger();

    expect(await new InMemoryLedgerRepository(ledger).get()).toBe(ledger);
  });

  it('replaces the ledger on save', async () => {
    const repository = new InMemoryLedgerRepository(new Ledger());
    const other = new Ledger();

    await repository.save(other);

    expect(await repository.get()).toBe(other);
  });
});

import { describe, expect, it } from 'vitest';
import { PendingRestocks } from '../../../../src/shop/domain/restock/PendingRestocks.js';
import { InMemoryPendingRestocksRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryPendingRestocksRepository.js';

describe('InMemoryPendingRestocksRepository', () => {
  it('returns the pending restocks it was created with', async () => {
    const pending = new PendingRestocks();

    expect(await new InMemoryPendingRestocksRepository(pending).get()).toBe(pending);
  });

  it('replaces the pending restocks on save', async () => {
    const repository = new InMemoryPendingRestocksRepository(new PendingRestocks());
    const other = new PendingRestocks();

    await repository.save(other);

    expect(await repository.get()).toBe(other);
  });
});

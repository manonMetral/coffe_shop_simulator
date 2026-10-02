import { describe, expect, it } from 'vitest';
import { CustomerQueue } from '../../../../src/shop/domain/customer/CustomerQueue.js';
import { InMemoryCustomerQueueRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryCustomerQueueRepository.js';

describe('InMemoryCustomerQueueRepository', () => {
  it('returns the queue it was created with', async () => {
    const queue = new CustomerQueue();

    expect(await new InMemoryCustomerQueueRepository(queue).get()).toBe(queue);
  });

  it('replaces the queue on save', async () => {
    const repository = new InMemoryCustomerQueueRepository(new CustomerQueue());
    const other = new CustomerQueue();

    await repository.save(other);

    expect(await repository.get()).toBe(other);
  });
});

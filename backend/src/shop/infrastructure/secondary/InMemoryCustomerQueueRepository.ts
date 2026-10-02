import type { CustomerQueue } from '../../domain/customer/CustomerQueue.js';
import type { CustomerQueueRepository } from '../../domain/customer/CustomerQueueRepository.js';

export class InMemoryCustomerQueueRepository implements CustomerQueueRepository {
  constructor(private queue: CustomerQueue) {}

  async get(): Promise<CustomerQueue> {
    return this.queue;
  }

  async save(queue: CustomerQueue): Promise<void> {
    this.queue = queue;
  }
}

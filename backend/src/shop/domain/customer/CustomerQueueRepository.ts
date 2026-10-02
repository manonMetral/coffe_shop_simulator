import type { CustomerQueue } from './CustomerQueue.js';

export interface CustomerQueueRepository {
  get(): Promise<CustomerQueue>;
}

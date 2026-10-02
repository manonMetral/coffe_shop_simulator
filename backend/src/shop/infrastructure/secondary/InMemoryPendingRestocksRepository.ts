import type { PendingRestocks } from '../../domain/restock/PendingRestocks.js';
import type { PendingRestocksRepository } from '../../domain/restock/PendingRestocksRepository.js';

export class InMemoryPendingRestocksRepository implements PendingRestocksRepository {
  constructor(private pendingRestocks: PendingRestocks) {}

  async get(): Promise<PendingRestocks> {
    return this.pendingRestocks;
  }

  async save(pendingRestocks: PendingRestocks): Promise<void> {
    this.pendingRestocks = pendingRestocks;
  }
}

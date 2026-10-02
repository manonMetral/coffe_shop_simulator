import type { PendingRestocks } from './PendingRestocks.js';

export interface PendingRestocksRepository {
  get(): Promise<PendingRestocks>;
  save(pendingRestocks: PendingRestocks): Promise<void>;
}

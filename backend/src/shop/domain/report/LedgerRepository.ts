import type { Ledger } from './Ledger.js';

export interface LedgerRepository {
  get(): Promise<Ledger>;
  save(ledger: Ledger): Promise<void>;
}

import type { Ledger } from '../../domain/report/Ledger.js';
import type { LedgerRepository } from '../../domain/report/LedgerRepository.js';

export class InMemoryLedgerRepository implements LedgerRepository {
  constructor(private ledger: Ledger) {}

  async get(): Promise<Ledger> {
    return this.ledger;
  }

  async save(ledger: Ledger): Promise<void> {
    this.ledger = ledger;
  }
}

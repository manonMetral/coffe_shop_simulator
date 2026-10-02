import type { CashRegister } from '../../domain/finance/CashRegister.js';
import type { CashRegisterRepository } from '../../domain/finance/CashRegisterRepository.js';

export class InMemoryCashRegisterRepository implements CashRegisterRepository {
  constructor(private cashRegister: CashRegister) {}

  async get(): Promise<CashRegister> {
    return this.cashRegister;
  }

  async save(cashRegister: CashRegister): Promise<void> {
    this.cashRegister = cashRegister;
  }
}

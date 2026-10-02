import type { CashRegisterRepository } from '../domain/finance/CashRegisterRepository.js';

export interface BalanceView {
  balanceCents: number;
}

export class FinanceApplicationService {
  constructor(private readonly cashRegisterRepository: CashRegisterRepository) {}

  async getBalance(): Promise<BalanceView> {
    const cashRegister = await this.cashRegisterRepository.get();
    return { balanceCents: cashRegister.balance().cents };
  }
}

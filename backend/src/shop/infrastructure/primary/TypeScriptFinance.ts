import type { FinanceApplicationService } from '../../application/FinanceApplicationService.js';

/** Entry point of the shop finances for the other bounded contexts. */
export class TypeScriptFinance {
  constructor(private readonly financeService: FinanceApplicationService) {}

  async balanceCents(): Promise<number> {
    return (await this.financeService.getBalance()).balanceCents;
  }
}

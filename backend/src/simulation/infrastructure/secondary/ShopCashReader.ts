import { TypeScriptFinance } from '../../../shop/infrastructure/primary/TypeScriptFinance.js';
import type { CashReader } from '../../domain/CashReader.js';

/** Reads the cash through the public entry point of the shop context. */
export class ShopCashReader implements CashReader {
  constructor(private readonly finance: TypeScriptFinance) {}

  balanceCents(): Promise<number> {
    return this.finance.balanceCents();
  }
}

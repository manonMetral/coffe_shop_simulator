import type { CashRegister } from './CashRegister.js';

export interface CashRegisterRepository {
  get(): Promise<CashRegister>;
  save(cashRegister: CashRegister): Promise<void>;
}

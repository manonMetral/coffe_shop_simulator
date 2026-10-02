import type { CashRegister } from './CashRegister.js';

export interface CashRegisterRepository {
  get(): Promise<CashRegister>;
}

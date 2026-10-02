import type { Customer } from './Customer';
import type { DayReport } from './DayReport';
import type { Server } from './Server';
import type { StockLevel } from './Stock';

export interface ShopState {
  readonly day: number;
  readonly minuteOfDay: number;
  readonly time: string;
  readonly dayLengthMinutes: number;
  /** How many times more often the customers arrive: 1 outside the rush hours. */
  readonly rushHourMultiplier: number;
  readonly cashCents: number;
  readonly queue: readonly Customer[];
  readonly servers: readonly Server[];
  readonly inventory: readonly StockLevel[];
  readonly reports: readonly DayReport[];
}

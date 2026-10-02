import type { Customer } from './Customer';
import type { Server } from './Server';

export interface ShopState {
  readonly day: number;
  readonly minuteOfDay: number;
  readonly time: string;
  readonly dayLengthMinutes: number;
  readonly cashCents: number;
  readonly queue: readonly Customer[];
  readonly servers: readonly Server[];
}

import type { Customer } from './Customer';

export interface ShopState {
  readonly day: number;
  readonly minuteOfDay: number;
  readonly time: string;
  readonly dayLengthMinutes: number;
  readonly cashCents: number;
  readonly queue: readonly Customer[];
}

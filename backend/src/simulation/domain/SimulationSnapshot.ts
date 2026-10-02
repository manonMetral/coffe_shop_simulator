import type { ShopSnapshot } from './ShopFlow.js';

/** Full state sent to a client when it connects: the time, and the shop. */
export interface SimulationSnapshot extends ShopSnapshot {
  readonly day: number;
  readonly minuteOfDay: number;
  readonly time: string;
  readonly dayLengthMinutes: number;
}

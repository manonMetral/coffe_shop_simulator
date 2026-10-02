import type { BroadcastEvent } from './BroadcastEvent.js';

/** What the shop (another bounded context) shows to the clients when they connect. */
export interface ShopSnapshot {
  readonly cashCents: number;
  readonly queue: readonly object[];
  readonly servers: readonly object[];
  readonly inventory: readonly object[];
  readonly reports: readonly object[];
}

/** The life of the shop, which belongs to another bounded context. */
export interface ShopFlow {
  /**
   * Lets the simulated time go by and returns what happened in the shop.
   * @param arrivalMultiplier How many times more often the customers arrive (1 outside the rush hours).
   */
  advance(simulatedMinutes: number, arrivalMultiplier: number): Promise<readonly BroadcastEvent[]>;
  /** Closes the accounts of a day that is over. */
  closeDay(day: number): Promise<readonly BroadcastEvent[]>;
  snapshot(): Promise<ShopSnapshot>;
}

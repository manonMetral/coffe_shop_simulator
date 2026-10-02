import type { BroadcastEvent } from './BroadcastEvent.js';

/** What the shop (another bounded context) shows to the clients when they connect. */
export interface ShopSnapshot {
  readonly cashCents: number;
  readonly queue: readonly object[];
  readonly servers: readonly object[];
}

/** The life of the shop, which belongs to another bounded context. */
export interface ShopFlow {
  /** Lets the simulated time go by and returns what happened in the shop. */
  advance(simulatedMinutes: number): Promise<readonly BroadcastEvent[]>;
  snapshot(): Promise<ShopSnapshot>;
}

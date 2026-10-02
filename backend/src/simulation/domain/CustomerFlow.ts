import type { BroadcastEvent } from './BroadcastEvent.js';

/** The customers of the shop, which belong to another bounded context. */
export interface CustomerFlow {
  /** Lets the simulated time go by and returns what happened to the customers. */
  advance(simulatedMinutes: number): Promise<readonly BroadcastEvent[]>;
  /** The customers currently waiting. */
  queue(): Promise<readonly object[]>;
}

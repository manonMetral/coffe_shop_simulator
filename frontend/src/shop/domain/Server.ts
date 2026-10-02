import type { DrinkName, Personality } from './Customer';

export type ServerName = 'Alice' | 'Bob' | 'Chloé';

/** The drink a server is preparing. */
export interface ServerOrder {
  readonly orderId: number;
  readonly customerId: number;
  readonly personality: Personality;
  readonly drink: DrinkName;
  /** Simulated minutes the preparation takes for this server. */
  readonly preparationMinutes: number;
  readonly remainingMinutes: number;
}

export interface Server {
  readonly name: ServerName;
  /** 1 is a normal speed, 2 prepares the drinks twice as fast. */
  readonly speed: number;
  readonly drinks: readonly DrinkName[];
  readonly order: ServerOrder | null;
}

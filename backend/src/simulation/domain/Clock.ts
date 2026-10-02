export interface Clock {
  /** Current real time in milliseconds since the epoch. */
  now(): number;
}

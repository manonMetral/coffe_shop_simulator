/** Full state sent to a client when it connects. */
export interface SimulationSnapshot {
  readonly day: number;
  readonly minuteOfDay: number;
  readonly time: string;
  readonly dayLengthMinutes: number;
  readonly cashCents: number;
}

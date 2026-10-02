export interface ClockTicked {
  readonly type: 'clock-tick';
  readonly day: number;
  readonly minuteOfDay: number;
  readonly time: string;
}

export interface DayStarted {
  readonly type: 'day-started';
  readonly day: number;
}

export interface DayEnded {
  readonly type: 'day-ended';
  readonly day: number;
}

export interface RushHourStarted {
  readonly type: 'rush-hour-started';
  /** How many times more often the customers arrive. */
  readonly multiplier: number;
}

export interface RushHourEnded {
  readonly type: 'rush-hour-ended';
}

export type SimulationEvent = ClockTicked | DayStarted | DayEnded | RushHourStarted | RushHourEnded;

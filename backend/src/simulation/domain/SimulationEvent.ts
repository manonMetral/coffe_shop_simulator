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

export type SimulationEvent = ClockTicked | DayStarted | DayEnded;

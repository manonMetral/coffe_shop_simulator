import { InvalidCalendarError } from './errors.js';
import type { SimulationEvent } from './SimulationEvent.js';

const MINUTES_PER_DAY = 24 * 60;

/** A period of the day when the customers arrive more often. */
export interface RushHour {
  /** Simulated minutes after the shop opens. */
  readonly startMinute: number;
  readonly durationMinutes: number;
  /** How many times more often the customers arrive. */
  readonly multiplier: number;
}

/** Simulated days: each day lasts `dayLengthMinutes` simulated minutes and opens at `dayStartHour`. */
export class Calendar {
  private rushHourAnnounced = false;

  private constructor(
    private currentDay: number,
    private elapsedMinutes: number,
    readonly dayLengthMinutes: number,
    private readonly dayStartHour: number,
    private readonly rushHours: readonly RushHour[],
  ) {}

  static start(
    dayLengthMinutes: number,
    dayStartHour: number,
    rushHours: readonly RushHour[] = [],
  ): Calendar {
    if (
      !Number.isInteger(dayLengthMinutes) ||
      dayLengthMinutes <= 0 ||
      dayLengthMinutes > MINUTES_PER_DAY
    ) {
      throw new InvalidCalendarError(`Invalid day length: ${dayLengthMinutes}`);
    }
    if (!Number.isInteger(dayStartHour) || dayStartHour < 0 || dayStartHour > 23) {
      throw new InvalidCalendarError(`Invalid day start hour: ${dayStartHour}`);
    }
    Calendar.checkRushHours(rushHours, dayLengthMinutes);
    return new Calendar(1, 0, dayLengthMinutes, dayStartHour, rushHours);
  }

  private static checkRushHours(rushHours: readonly RushHour[], dayLengthMinutes: number): void {
    const sorted = [...rushHours].sort((a, b) => a.startMinute - b.startMinute);
    sorted.forEach((rushHour, index) => {
      const { startMinute, durationMinutes, multiplier } = rushHour;
      if (!Number.isInteger(startMinute) || startMinute < 0) {
        throw new InvalidCalendarError(`Invalid rush hour start: ${startMinute}`);
      }
      if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
        throw new InvalidCalendarError(`Invalid rush hour duration: ${durationMinutes}`);
      }
      if (!Number.isFinite(multiplier) || multiplier <= 0) {
        throw new InvalidCalendarError(`Invalid rush hour multiplier: ${multiplier}`);
      }
      if (startMinute + durationMinutes > dayLengthMinutes) {
        throw new InvalidCalendarError('A rush hour must end before the end of the day');
      }
      const next = sorted[index + 1];
      if (next && startMinute + durationMinutes > next.startMinute) {
        throw new InvalidCalendarError('Rush hours cannot overlap');
      }
    });
  }

  get day(): number {
    return this.currentDay;
  }

  /** How many times more often the customers arrive right now: 1 outside the rush hours. */
  get arrivalMultiplier(): number {
    return this.currentRushHour()?.multiplier ?? 1;
  }

  get minuteOfDay(): number {
    return Math.floor(this.elapsedMinutes);
  }

  /** Time of the day as HH:MM. */
  get time(): string {
    const minutes = (this.dayStartHour * 60 + this.minuteOfDay) % MINUTES_PER_DAY;
    const hours = Math.floor(minutes / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  /**
   * Advances the simulated time, ending the current day (and starting the next) when needed.
   * The ticks are short: a rush hour is announced when a tick finds it started or over.
   */
  advance(minutes: number): SimulationEvent[] {
    if (!Number.isFinite(minutes) || minutes < 0) {
      throw new InvalidCalendarError(`Invalid duration: ${minutes}`);
    }

    const events: SimulationEvent[] = [];
    let remaining = minutes;
    while (this.elapsedMinutes + remaining >= this.dayLengthMinutes) {
      remaining -= this.dayLengthMinutes - this.elapsedMinutes;
      this.elapsedMinutes = this.dayLengthMinutes;
      this.announceRushHour(events);
      events.push({ type: 'day-ended', day: this.currentDay });
      this.currentDay += 1;
      this.elapsedMinutes = 0;
      events.push({ type: 'day-started', day: this.currentDay });
      this.announceRushHour(events);
    }
    this.elapsedMinutes += remaining;
    this.announceRushHour(events);
    events.push({
      type: 'clock-tick',
      day: this.currentDay,
      minuteOfDay: this.minuteOfDay,
      time: this.time,
    });
    return events;
  }

  private currentRushHour(): RushHour | undefined {
    return this.rushHours.find(
      ({ startMinute, durationMinutes }) =>
        this.elapsedMinutes >= startMinute && this.elapsedMinutes < startMinute + durationMinutes,
    );
  }

  private announceRushHour(events: SimulationEvent[]): void {
    const current = this.currentRushHour();
    if (current && !this.rushHourAnnounced) {
      events.push({ type: 'rush-hour-started', multiplier: current.multiplier });
    } else if (!current && this.rushHourAnnounced) {
      events.push({ type: 'rush-hour-ended' });
    }
    this.rushHourAnnounced = current !== undefined;
  }
}

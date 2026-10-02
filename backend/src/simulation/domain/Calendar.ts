import { InvalidCalendarError } from './errors.js';
import type { SimulationEvent } from './SimulationEvent.js';

const MINUTES_PER_DAY = 24 * 60;

/** Simulated days: each day lasts `dayLengthMinutes` simulated minutes and opens at `dayStartHour`. */
export class Calendar {
  private constructor(
    private currentDay: number,
    private elapsedMinutes: number,
    readonly dayLengthMinutes: number,
    private readonly dayStartHour: number,
  ) {}

  static start(dayLengthMinutes: number, dayStartHour: number): Calendar {
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
    return new Calendar(1, 0, dayLengthMinutes, dayStartHour);
  }

  get day(): number {
    return this.currentDay;
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

  /** Advances the simulated time, ending the current day (and starting the next) when needed. */
  advance(minutes: number): SimulationEvent[] {
    if (!Number.isFinite(minutes) || minutes < 0) {
      throw new InvalidCalendarError(`Invalid duration: ${minutes}`);
    }

    const events: SimulationEvent[] = [];
    let remaining = minutes;
    while (this.elapsedMinutes + remaining >= this.dayLengthMinutes) {
      remaining -= this.dayLengthMinutes - this.elapsedMinutes;
      events.push({ type: 'day-ended', day: this.currentDay });
      this.currentDay += 1;
      this.elapsedMinutes = 0;
      events.push({ type: 'day-started', day: this.currentDay });
    }
    this.elapsedMinutes += remaining;
    events.push({
      type: 'clock-tick',
      day: this.currentDay,
      minuteOfDay: this.minuteOfDay,
      time: this.time,
    });
    return events;
  }
}

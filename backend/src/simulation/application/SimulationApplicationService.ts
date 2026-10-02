import type { CalendarRepository } from '../domain/CalendarRepository.js';
import type { CashReader } from '../domain/CashReader.js';
import type { Clock } from '../domain/Clock.js';
import type { EventPublisher } from '../domain/EventPublisher.js';
import type { SimulationSnapshot } from '../domain/SimulationSnapshot.js';
import type { TickScheduler } from '../domain/TickScheduler.js';

export interface SimulationSettings {
  /** Simulated minutes elapsed per real minute. */
  readonly timeScale: number;
  readonly tickIntervalMs: number;
}

const MILLISECONDS_PER_MINUTE = 60_000;

export class SimulationApplicationService {
  private lastTickAt = 0;

  constructor(
    private readonly calendarRepository: CalendarRepository,
    private readonly clock: Clock,
    private readonly scheduler: TickScheduler,
    private readonly publisher: EventPublisher,
    private readonly cashReader: CashReader,
    private readonly settings: SimulationSettings,
  ) {}

  start(): void {
    this.lastTickAt = this.clock.now();
    this.scheduler.schedule(() => void this.tick(), this.settings.tickIntervalMs);
  }

  stop(): void {
    this.scheduler.cancel();
  }

  /** Advances the simulated time by the real time elapsed since the previous tick. */
  async tick(): Promise<void> {
    const now = this.clock.now();
    const simulatedMinutes =
      ((now - this.lastTickAt) / MILLISECONDS_PER_MINUTE) * this.settings.timeScale;
    this.lastTickAt = now;

    const calendar = await this.calendarRepository.get();
    const events = calendar.advance(simulatedMinutes);
    await this.calendarRepository.save(calendar);
    events.forEach((event) => this.publisher.publish(event));
  }

  async getSnapshot(): Promise<SimulationSnapshot> {
    const [calendar, cashCents] = await Promise.all([
      this.calendarRepository.get(),
      this.cashReader.balanceCents(),
    ]);
    return {
      day: calendar.day,
      minuteOfDay: calendar.minuteOfDay,
      time: calendar.time,
      dayLengthMinutes: calendar.dayLengthMinutes,
      cashCents,
    };
  }
}

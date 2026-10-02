import type { CalendarRepository } from '../domain/CalendarRepository.js';
import type { Clock } from '../domain/Clock.js';
import type { EventPublisher } from '../domain/EventPublisher.js';
import type { Logger } from '../domain/Logger.js';
import type { ShopFlow } from '../domain/ShopFlow.js';
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
    private readonly shopFlow: ShopFlow,
    private readonly logger: Logger,
    private readonly settings: SimulationSettings,
  ) {}

  start(): void {
    this.lastTickAt = this.clock.now();
    this.scheduler.schedule(() => void this.runTick(), this.settings.tickIntervalMs);
  }

  stop(): void {
    this.scheduler.cancel();
  }

  /** Advances the simulated time by the real time elapsed since the previous tick. */
  async tick(): Promise<void> {
    const now = this.clock.now();
    // The system clock can go backwards (NTP, VM resume): the simulation then just waits.
    const elapsedMs = Math.max(0, now - this.lastTickAt);
    const simulatedMinutes = (elapsedMs / MILLISECONDS_PER_MINUTE) * this.settings.timeScale;
    this.lastTickAt = now;

    const calendar = await this.calendarRepository.get();
    // The customers of this tick arrive at the rate of the moment the tick starts.
    const arrivalMultiplier = calendar.arrivalMultiplier;
    const events = calendar.advance(simulatedMinutes);
    await this.calendarRepository.save(calendar);
    events.forEach((event) => this.publisher.publish(event));

    const shopEvents = await this.shopFlow.advance(simulatedMinutes, arrivalMultiplier);
    shopEvents.forEach((event) => this.publisher.publish(event));

    for (const event of events) {
      if (event.type === 'day-ended') {
        const reportEvents = await this.shopFlow.closeDay(event.day);
        reportEvents.forEach((reportEvent) => this.publisher.publish(reportEvent));
      }
    }
  }

  /** A failing tick is logged and the next ones still run: it must never crash the process. */
  private async runTick(): Promise<void> {
    try {
      await this.tick();
    } catch (error) {
      this.logger.error('Simulation tick failed', error);
    }
  }

  async getSnapshot(): Promise<SimulationSnapshot> {
    const [calendar, shop] = await Promise.all([
      this.calendarRepository.get(),
      this.shopFlow.snapshot(),
    ]);
    return {
      day: calendar.day,
      minuteOfDay: calendar.minuteOfDay,
      time: calendar.time,
      dayLengthMinutes: calendar.dayLengthMinutes,
      rushHourMultiplier: calendar.arrivalMultiplier,
      ...shop,
    };
  }
}

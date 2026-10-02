import { afterEach, describe, expect, it, vi } from 'vitest';
import { SimulationApplicationService } from '../../../src/simulation/application/SimulationApplicationService.js';
import { Calendar } from '../../../src/simulation/domain/Calendar.js';
import type { BroadcastEvent } from '../../../src/simulation/domain/BroadcastEvent.js';
import type { CustomerFlow } from '../../../src/simulation/domain/CustomerFlow.js';
import { InMemoryCalendarRepository } from '../../../src/simulation/infrastructure/secondary/InMemoryCalendarRepository.js';

function createService(
  options: {
    cashReader?: { balanceCents: () => Promise<number> };
    customerFlow?: CustomerFlow;
  } = {},
) {
  const clock = { current: 1_000_000, now: () => clock.current };
  const scheduler = {
    onTick: undefined as (() => void) | undefined,
    intervalMs: 0,
    schedule: vi.fn(),
    cancel: vi.fn(),
  };
  scheduler.schedule.mockImplementation((onTick: () => void, intervalMs: number) => {
    scheduler.onTick = onTick;
    scheduler.intervalMs = intervalMs;
  });
  const published: BroadcastEvent[] = [];
  const publisher = { publish: (event: BroadcastEvent) => void published.push(event) };
  const cashReader = options.cashReader ?? { balanceCents: async () => 30000 };
  const customerFlow: CustomerFlow = options.customerFlow ?? {
    advance: async () => [],
    queue: async () => [],
  };
  const logger = { error: vi.fn() };
  const service = new SimulationApplicationService(
    new InMemoryCalendarRepository(Calendar.start(480, 8)),
    clock,
    scheduler,
    publisher,
    cashReader,
    customerFlow,
    logger,
    { timeScale: 8, tickIntervalMs: 1000 },
  );
  return { service, clock, scheduler, published, logger };
}

describe('SimulationApplicationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('schedules a tick at the configured interval when it starts', () => {
    const { service, scheduler } = createService();

    service.start();

    expect(scheduler.schedule).toHaveBeenCalledOnce();
    expect(scheduler.intervalMs).toBe(1000);
  });

  it('cancels the scheduler when it stops', () => {
    const { service, scheduler } = createService();

    service.stop();

    expect(scheduler.cancel).toHaveBeenCalledOnce();
  });

  it('runs a simulated minute count of timeScale per real minute', async () => {
    const { service, clock, published } = createService();
    service.start();

    clock.current += 60_000;
    await service.tick();

    expect(published).toEqual([{ type: 'clock-tick', day: 1, minuteOfDay: 8, time: '08:08' }]);
  });

  it('lasts one real hour for a simulated day of 8 hours', async () => {
    const { service, clock, published } = createService();
    service.start();

    clock.current += 3_600_000;
    await service.tick();

    expect(published.map((event) => event.type)).toEqual([
      'day-ended',
      'day-started',
      'clock-tick',
    ]);
  });

  it('only counts the time elapsed since the previous tick', async () => {
    const { service, clock, published } = createService();
    service.start();

    clock.current += 60_000;
    await service.tick();
    clock.current += 60_000;
    await service.tick();

    expect(published.at(-1)).toMatchObject({ minuteOfDay: 16 });
  });

  it('ticks when the scheduler fires', async () => {
    const { service, clock, scheduler, published } = createService();
    service.start();

    clock.current += 60_000;
    scheduler.onTick?.();

    await vi.waitFor(() => expect(published).toHaveLength(1));
  });

  it('does not move the time backwards when the system clock goes back', async () => {
    const { service, clock, published } = createService();
    service.start();

    clock.current -= 60_000;
    await service.tick();
    clock.current += 120_000;
    await service.tick();

    expect(published).toEqual([
      { type: 'clock-tick', day: 1, minuteOfDay: 0, time: '08:00' },
      { type: 'clock-tick', day: 1, minuteOfDay: 16, time: '08:16' },
    ]);
  });

  it('logs a failing tick instead of crashing, and keeps ticking', async () => {
    const { service, clock, scheduler, published, logger } = createService();
    const failure = new Error('publisher down');
    service.start();
    vi.spyOn(Calendar.prototype, 'advance').mockImplementationOnce(() => {
      throw failure;
    });

    clock.current += 60_000;
    scheduler.onTick?.();
    await vi.waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith('Simulation tick failed', failure),
    );

    clock.current += 60_000;
    scheduler.onTick?.();
    await vi.waitFor(() => expect(published).toHaveLength(1));
  });

  it('returns a snapshot with the time and the cash of the shop', async () => {
    const { service, clock } = createService();
    service.start();
    clock.current += 60_000;
    await service.tick();

    expect(await service.getSnapshot()).toEqual({
      day: 1,
      minuteOfDay: 8,
      time: '08:08',
      dayLengthMinutes: 480,
      cashCents: 30000,
      queue: [],
    });
  });
  describe('customers', () => {
    it('lets the customers live the simulated time and publishes what happened, after the calendar events', async () => {
      const advance = vi.fn(async () => [{ type: 'customer-arrived' }, { type: 'queue-updated' }]);
      const { service, clock, published } = createService({
        customerFlow: { advance, queue: async () => [] },
      });
      service.start();

      clock.current += 60_000;
      await service.tick();

      expect(advance).toHaveBeenCalledWith(8);
      expect(published.map((event) => event.type)).toEqual([
        'clock-tick',
        'customer-arrived',
        'queue-updated',
      ]);
    });

    it('includes the waiting customers in the snapshot', async () => {
      const queue = [{ id: 1 }, { id: 2 }];
      const { service } = createService({
        customerFlow: { advance: async () => [], queue: async () => queue },
      });

      expect((await service.getSnapshot()).queue).toEqual(queue);
    });

    it('logs a failure of the customers without crashing', async () => {
      const failure = new Error('customers are down');
      const { service, clock, scheduler, logger } = createService({
        customerFlow: {
          advance: async () => {
            throw failure;
          },
          queue: async () => [],
        },
      });
      service.start();

      clock.current += 60_000;
      scheduler.onTick?.();

      await vi.waitFor(() =>
        expect(logger.error).toHaveBeenCalledWith('Simulation tick failed', failure),
      );
    });
  });
});

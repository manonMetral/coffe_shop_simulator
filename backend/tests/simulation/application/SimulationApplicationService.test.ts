import { afterEach, describe, expect, it, vi } from 'vitest';
import { SimulationApplicationService } from '../../../src/simulation/application/SimulationApplicationService.js';
import { Calendar } from '../../../src/simulation/domain/Calendar.js';
import type { BroadcastEvent } from '../../../src/simulation/domain/BroadcastEvent.js';
import type { ShopFlow, ShopSnapshot } from '../../../src/simulation/domain/ShopFlow.js';
import { InMemoryCalendarRepository } from '../../../src/simulation/infrastructure/secondary/InMemoryCalendarRepository.js';

const emptyShop: ShopSnapshot = {
  cashCents: 30000,
  queue: [],
  servers: [],
  inventory: [],
  reports: [],
};

function createService(options: { shopFlow?: ShopFlow; calendar?: Calendar } = {}) {
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
  const shopFlow: ShopFlow = options.shopFlow ?? {
    advance: async () => [],
    closeDay: async () => [],
    snapshot: async () => emptyShop,
  };
  const logger = { error: vi.fn() };
  const service = new SimulationApplicationService(
    new InMemoryCalendarRepository(options.calendar ?? Calendar.start(480, 8)),
    clock,
    scheduler,
    publisher,
    shopFlow,
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
      servers: [],
      inventory: [],
      reports: [],
      rushHourMultiplier: 1,
    });
  });
  describe('shop', () => {
    it('lets the shop live the simulated time and publishes what happened, after the calendar events', async () => {
      const advance = vi.fn(async () => [{ type: 'order-started' }, { type: 'queue-updated' }]);
      const { service, clock, published } = createService({
        shopFlow: { advance, closeDay: async () => [], snapshot: async () => emptyShop },
      });
      service.start();

      clock.current += 60_000;
      await service.tick();

      expect(advance).toHaveBeenCalledWith(8, 1);
      expect(published.map((event) => event.type)).toEqual([
        'clock-tick',
        'order-started',
        'queue-updated',
      ]);
    });

    it('includes the cash, the queue, the servers, the stock and the reports in the snapshot', async () => {
      const shop: ShopSnapshot = {
        cashCents: 12345,
        queue: [{ id: 1 }],
        servers: [{ name: 'Alice' }],
        inventory: [{ ingredient: 'Café' }],
        reports: [{ day: 1 }],
      };
      const { service } = createService({
        shopFlow: { advance: async () => [], closeDay: async () => [], snapshot: async () => shop },
      });

      expect(await service.getSnapshot()).toMatchObject(shop);
    });

    it('logs a failure of the shop without crashing', async () => {
      const failure = new Error('the shop is down');
      const { service, clock, scheduler, logger } = createService({
        shopFlow: {
          advance: async () => {
            throw failure;
          },
          closeDay: async () => [],
          snapshot: async () => emptyShop,
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

  describe('rush hours', () => {
    const rushCalendar = () =>
      Calendar.start(480, 8, [{ startMinute: 8, durationMinutes: 10, multiplier: 3 }]);

    it('tells the shop how much more often the customers arrive during the rush hour', async () => {
      const advance = vi.fn(async (_minutes: number, _arrivalMultiplier: number) => []);
      const shopFlow = { advance, closeDay: async () => [], snapshot: async () => emptyShop };
      const { service, clock } = createService({ shopFlow, calendar: rushCalendar() });
      service.start();

      clock.current += 60_000; // 8 simulated minutes: the rush hour starts at the end of this tick
      await service.tick();
      clock.current += 15_000; // 2 simulated minutes, inside the rush hour
      await service.tick();

      expect(advance.mock.calls.map((call) => call[1])).toEqual([1, 3]);
    });

    it('announces the start and the end of the rush hour to the clients', async () => {
      const { service, clock, published } = createService({ calendar: rushCalendar() });
      service.start();

      clock.current += 60_000;
      await service.tick();
      clock.current += 75_000; // 10 more simulated minutes: the rush hour is over
      await service.tick();

      expect(published.map((event) => event.type)).toEqual([
        'rush-hour-started',
        'clock-tick',
        'rush-hour-ended',
        'clock-tick',
      ]);
    });

    it('shows the rush hour in the snapshot', async () => {
      const { service, clock } = createService({ calendar: rushCalendar() });
      service.start();
      clock.current += 60_000;
      await service.tick();

      expect((await service.getSnapshot()).rushHourMultiplier).toBe(3);
    });
  });

  describe('end of the day', () => {
    it('closes the accounts of the shop when a day ends and publishes the report after the other events', async () => {
      const closeDay = vi.fn(async (day: number) => [{ type: 'day-report', day }]);
      const shopFlow = {
        advance: async () => [{ type: 'queue-updated' }],
        closeDay,
        snapshot: async () => emptyShop,
      };
      const { service, clock, published } = createService({ shopFlow });
      service.start();

      clock.current += 3_600_000; // a whole day
      await service.tick();

      expect(closeDay).toHaveBeenCalledExactlyOnceWith(1);
      expect(published.map((event) => event.type)).toEqual([
        'day-ended',
        'day-started',
        'clock-tick',
        'queue-updated',
        'day-report',
      ]);
    });

    it('does not close any accounts during the day', async () => {
      const closeDay = vi.fn(async () => []);
      const shopFlow = { advance: async () => [], closeDay, snapshot: async () => emptyShop };
      const { service, clock } = createService({ shopFlow });
      service.start();

      clock.current += 60_000;
      await service.tick();

      expect(closeDay).not.toHaveBeenCalled();
    });
  });
});

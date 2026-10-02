import { describe, expect, it, vi } from 'vitest';
import type { ShopGateway, ShopGatewayHandlers } from '../domain/ShopGateway';
import type { ShopState } from '../domain/ShopState';
import { JOURNAL_SIZE, ShopApplicationService, type ShopView } from './ShopApplicationService';

const snapshot: ShopState = {
  day: 1,
  minuteOfDay: 0,
  time: '08:00',
  dayLengthMinutes: 480,
  cashCents: 30000,
  queue: [],
  servers: [],
  inventory: [],
  reports: [],
  rushHourMultiplier: 1,
};

function createService() {
  let handlers!: ShopGatewayHandlers;
  const gateway: ShopGateway = {
    connect: (given) => {
      handlers = given;
    },
    disconnect: vi.fn(),
  };
  const views: ShopView[] = [];
  const service = new ShopApplicationService(gateway);
  service.start((view) => views.push(view));
  return { service, gateway, views, handlers: () => handlers };
}

describe('ShopApplicationService', () => {
  it('starts without data while connecting', () => {
    const { views } = createService();

    expect(views).toEqual([]);
  });

  it('exposes the connection status', () => {
    const { views, handlers } = createService();

    handlers().onStatus('open');

    expect(views).toEqual([{ state: null, status: 'open', journal: [] }]);
  });

  it('stores the snapshot', () => {
    const { views, handlers } = createService();

    handlers().onMessage({ type: 'snapshot', data: snapshot });

    expect(views.at(-1)).toEqual({ state: snapshot, status: 'connecting', journal: [] });
  });

  it('applies the events on top of the snapshot', () => {
    const { views, handlers } = createService();

    handlers().onMessage({ type: 'snapshot', data: snapshot });
    handlers().onMessage({
      type: 'event',
      data: { type: 'clock-tick', day: 1, minuteOfDay: 8, time: '08:08' },
    });

    expect(views.at(-1)?.state).toEqual({ ...snapshot, minuteOfDay: 8, time: '08:08' });
  });

  it('ignores the events received before the snapshot', () => {
    const { views, handlers } = createService();

    handlers().onMessage({ type: 'event', data: { type: 'day-started', day: 2 } });

    expect(views.at(-1)).toEqual({ state: null, status: 'connecting', journal: [] });
  });

  it('disconnects the gateway when it stops', () => {
    const { service, gateway } = createService();

    service.stop();

    expect(gateway.disconnect).toHaveBeenCalledOnce();
  });

  describe('journal', () => {
    it('remembers the events worth writing down, with the day and the time they happened', () => {
      const { views, handlers } = createService();
      handlers().onMessage({ type: 'snapshot', data: snapshot });
      handlers().onMessage({
        type: 'event',
        data: { type: 'clock-tick', day: 1, minuteOfDay: 12, time: '08:12' },
      });

      handlers().onMessage({
        type: 'event',
        data: { type: 'stock-low', ingredient: 'Café', remaining: 100 },
      });

      expect(views.at(-1)?.journal).toEqual([
        {
          id: 1,
          day: 1,
          time: '08:12',
          event: { type: 'stock-low', ingredient: 'Café', remaining: 100 },
        },
      ]);
    });

    it('does not remember the events that only keep the display up to date', () => {
      const { views, handlers } = createService();
      handlers().onMessage({ type: 'snapshot', data: snapshot });

      handlers().onMessage({
        type: 'event',
        data: { type: 'clock-tick', day: 1, minuteOfDay: 1, time: '08:01' },
      });
      handlers().onMessage({ type: 'event', data: { type: 'queue-updated', queue: [] } });
      handlers().onMessage({ type: 'event', data: { type: 'servers-updated', servers: [] } });
      handlers().onMessage({ type: 'event', data: { type: 'inventory-updated', inventory: [] } });

      expect(views.at(-1)?.journal).toEqual([]);
    });

    it('ignores the events received before the snapshot', () => {
      const { views, handlers } = createService();

      handlers().onMessage({ type: 'event', data: { type: 'rush-hour-ended' } });

      expect(views.at(-1)?.journal).toEqual([]);
    });

    it('shows the most recent event first', () => {
      const { views, handlers } = createService();
      handlers().onMessage({ type: 'snapshot', data: snapshot });

      handlers().onMessage({ type: 'event', data: { type: 'rush-hour-started', multiplier: 2.5 } });
      handlers().onMessage({ type: 'event', data: { type: 'rush-hour-ended' } });

      expect(views.at(-1)?.journal.map((entry) => entry.event.type)).toEqual([
        'rush-hour-ended',
        'rush-hour-started',
      ]);
    });

    it('keeps only the last events', () => {
      const { views, handlers } = createService();
      handlers().onMessage({ type: 'snapshot', data: snapshot });

      for (let day = 1; day <= JOURNAL_SIZE + 10; day += 1) {
        handlers().onMessage({ type: 'event', data: { type: 'day-started', day } });
      }

      const journal = views.at(-1)?.journal ?? [];
      expect(journal).toHaveLength(JOURNAL_SIZE);
      expect(journal[0]?.event).toEqual({ type: 'day-started', day: JOURNAL_SIZE + 10 });
    });
  });
});

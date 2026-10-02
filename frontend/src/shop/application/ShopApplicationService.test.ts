import { describe, expect, it, vi } from 'vitest';
import type { ShopGateway, ShopGatewayHandlers } from '../domain/ShopGateway';
import type { ShopState } from '../domain/ShopState';
import { ShopApplicationService, type ShopView } from './ShopApplicationService';

const snapshot: ShopState = {
  day: 1,
  minuteOfDay: 0,
  time: '08:00',
  dayLengthMinutes: 480,
  cashCents: 30000,
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

    expect(views).toEqual([{ state: null, status: 'open' }]);
  });

  it('stores the snapshot', () => {
    const { views, handlers } = createService();

    handlers().onMessage({ type: 'snapshot', data: snapshot });

    expect(views.at(-1)).toEqual({ state: snapshot, status: 'connecting' });
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

    expect(views.at(-1)).toEqual({ state: null, status: 'connecting' });
  });

  it('disconnects the gateway when it stops', () => {
    const { service, gateway } = createService();

    service.stop();

    expect(gateway.disconnect).toHaveBeenCalledOnce();
  });
});

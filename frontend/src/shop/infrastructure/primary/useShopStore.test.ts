import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import type { ShopApplicationService, ShopView } from '../../application/ShopApplicationService';
import { shopServiceKey } from './shopServiceKey';
import { useShopStore } from './useShopStore';

function createStore(service?: ShopApplicationService) {
  const app = createApp({});
  app.use(createPinia());
  if (service) {
    app.provide(shopServiceKey, service);
  }
  return app.runWithContext(() => useShopStore());
}

describe('useShopStore', () => {
  it('starts without data while connecting', () => {
    const store = createStore({
      start: vi.fn(),
      stop: vi.fn(),
    } as unknown as ShopApplicationService);

    expect(store.view).toEqual({ state: null, status: 'connecting', journal: [] });
  });

  it('follows the views given by the application service', () => {
    const service = { start: vi.fn(), stop: vi.fn() };
    const store = createStore(service as unknown as ShopApplicationService);

    store.start();
    const onChange = service.start.mock.calls[0]?.[0] as (view: ShopView) => void;
    onChange({ state: null, status: 'open', journal: [] });

    expect(store.view.status).toBe('open');
  });

  it('stops the application service', () => {
    const service = { start: vi.fn(), stop: vi.fn() };
    const store = createStore(service as unknown as ShopApplicationService);

    store.stop();

    expect(service.stop).toHaveBeenCalledOnce();
  });

  it('fails when the application service is not provided', () => {
    expect(() => createStore()).toThrow('ShopApplicationService is not provided');
  });
});

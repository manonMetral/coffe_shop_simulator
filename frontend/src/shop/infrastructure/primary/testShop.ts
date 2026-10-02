import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { nextTick, type Component } from 'vue';
import { vi } from 'vitest';
import type { ShopApplicationService, ShopView } from '../../application/ShopApplicationService';
import type { ShopState } from '../../domain/ShopState';
import { shopServiceKey } from './shopServiceKey';
import { useShopStore } from './useShopStore';

export const shopState = (changes: Partial<ShopState> = {}): ShopState => ({
  day: 1,
  minuteOfDay: 0,
  time: '08:00',
  dayLengthMinutes: 480,
  rushHourMultiplier: 1,
  cashCents: 30000,
  queue: [],
  servers: [],
  inventory: [],
  reports: [],
  ...changes,
});

/** Mounts a component that only reads the store, and lets the test change what the store shows. */
export function mountWithShop(component: Component) {
  const service = { start: vi.fn(), stop: vi.fn() } as unknown as ShopApplicationService;
  const pinia = createPinia();
  const wrapper = mount(component, {
    global: { plugins: [pinia], provide: { [shopServiceKey as symbol]: service } },
  });
  const show = async (view: Partial<ShopView>) => {
    useShopStore(pinia).view = { state: shopState(), status: 'open', journal: [], ...view };
    await nextTick();
  };
  return { wrapper, show };
}

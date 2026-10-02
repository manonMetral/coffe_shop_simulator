import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import type { HealthApplicationService } from '../health/application/HealthApplicationService';
import { healthServiceKey } from '../health/infrastructure/primary/healthServiceKey';
import type { ShopApplicationService } from '../shop/application/ShopApplicationService';
import { shopServiceKey } from '../shop/infrastructure/primary/shopServiceKey';
import HomeView from './HomeView.vue';

describe('HomeView', () => {
  it('checks the API on mount and displays its status next to the shop status bar', async () => {
    const healthService = { check: async () => 'ok' } as HealthApplicationService;
    const shopService = { start: vi.fn(), stop: vi.fn() } as unknown as ShopApplicationService;

    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        provide: {
          [healthServiceKey as symbol]: healthService,
          [shopServiceKey as symbol]: shopService,
        },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Coffee Shop Simulator');
    expect(wrapper.text()).toContain('API : ok');
    expect(shopService.start).toHaveBeenCalledOnce();
    expect(wrapper.find('.status-bar').exists()).toBe(true);
    expect(wrapper.text()).toContain("File d'attente");
    expect(wrapper.text()).toContain('Serveurs');
  });
});

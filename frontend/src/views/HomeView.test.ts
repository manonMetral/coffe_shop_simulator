import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import type { ShopApplicationService } from '../shop/application/ShopApplicationService';
import { shopServiceKey } from '../shop/infrastructure/primary/shopServiceKey';
import HomeView from './HomeView.vue';

describe('HomeView', () => {
  it('renders the shop status bar and the shop panels', async () => {
    const shopService = { start: vi.fn(), stop: vi.fn() } as unknown as ShopApplicationService;

    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        provide: {
          [shopServiceKey as symbol]: shopService,
        },
      },
    });

    expect(wrapper.text()).toContain('Coffee Shop Simulator');
    expect(shopService.start).toHaveBeenCalledOnce();
    expect(wrapper.find('.status-bar').exists()).toBe(true);
    expect(wrapper.text()).toContain("File d'attente");
    expect(wrapper.text()).toContain('Serveurs');
    expect(wrapper.find('.scene').exists()).toBe(true);
    for (const title of ['Stock', 'Bilans des journées', 'Journal']) {
      expect(wrapper.text()).toContain(title);
    }
  });
});

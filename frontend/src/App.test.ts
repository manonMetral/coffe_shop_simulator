import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import router from './router';
import type { ShopApplicationService } from './shop/application/ShopApplicationService';
import { shopServiceKey } from './shop/infrastructure/primary/shopServiceKey';

describe('App', () => {
  it('renders the navigation and the routed view', async () => {
    const shopService = { start: vi.fn(), stop: vi.fn() } as unknown as ShopApplicationService;
    await router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
        provide: {
          [shopServiceKey as symbol]: shopService,
        },
      },
    });

    expect(wrapper.find('nav a').text()).toBe('Accueil');
    expect(wrapper.find('h1').text()).toContain('Coffee Shop Simulator');
  });
});

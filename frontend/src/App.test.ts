import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import App from './App.vue';
import type { HealthApplicationService } from './health/application/HealthApplicationService';
import { healthServiceKey } from './health/infrastructure/primary/healthServiceKey';
import router from './router';

describe('App', () => {
  it('renders the navigation and the routed view', async () => {
    const healthService = { check: async () => 'down' } as HealthApplicationService;
    await router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
        provide: { [healthServiceKey as symbol]: healthService },
      },
    });

    expect(wrapper.find('nav a').text()).toBe('Accueil');
    expect(wrapper.find('h1').text()).toContain('Coffee Shop Simulator');
  });
});

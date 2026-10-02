import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import type { HealthApplicationService } from '../../application/HealthApplicationService';
import HomeView from './HomeView.vue';
import { healthServiceKey } from './healthServiceKey';

describe('HomeView', () => {
  it('checks the API on mount and displays its status', async () => {
    const healthService = { check: async () => 'ok' } as HealthApplicationService;

    const wrapper = mount(HomeView, {
      global: {
        plugins: [createPinia()],
        provide: { [healthServiceKey as symbol]: healthService },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Coffee Shop Simulator');
    expect(wrapper.text()).toContain('API : ok');
  });
});

import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeView from './HomeView.vue';

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('checks the API on mount and displays its status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', uptime: 1 }) }),
    );

    const wrapper = mount(HomeView);
    await flushPromises();

    expect(wrapper.text()).toContain('Coffee Shop Simulator');
    expect(wrapper.text()).toContain('API : ok');
  });
});

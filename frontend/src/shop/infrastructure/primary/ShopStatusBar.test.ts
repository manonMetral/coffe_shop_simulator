import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { ShopApplicationService, ShopView } from '../../application/ShopApplicationService';
import ShopStatusBar from './ShopStatusBar.vue';
import { shopServiceKey } from './shopServiceKey';

function mountBar() {
  const service = { start: vi.fn(), stop: vi.fn() };
  const wrapper = mount(ShopStatusBar, {
    global: {
      plugins: [createPinia()],
      provide: { [shopServiceKey as symbol]: service as unknown as ShopApplicationService },
    },
  });
  const push = async (view: ShopView) => {
    (service.start.mock.calls[0]?.[0] as (view: ShopView) => void)(view);
    await nextTick();
  };
  return { service, wrapper, push };
}

describe('ShopStatusBar', () => {
  it('follows the shop while mounted', () => {
    const { service, wrapper } = mountBar();
    expect(service.start).toHaveBeenCalledOnce();

    wrapper.unmount();
    expect(service.stop).toHaveBeenCalledOnce();
  });

  it('waits for the data while connecting', () => {
    const { wrapper } = mountBar();

    expect(wrapper.text()).toContain('En attente des données…');
    expect(wrapper.text()).toContain('Connexion…');
  });

  it('shows the day, the time and the cash', async () => {
    const { wrapper, push } = mountBar();

    await push({
      state: { day: 3, minuteOfDay: 90, time: '09:30', dayLengthMinutes: 480, cashCents: 30000 },
      status: 'open',
    });

    expect(wrapper.text()).toContain('Jour 3');
    expect(wrapper.text()).toContain('09:30');
    expect(wrapper.text().replace(/\s/g, ' ')).toContain('Caisse 300,00 €');
    expect(wrapper.text()).toContain('Connecté');
  });

  it('shows when the connection is lost', async () => {
    const { wrapper, push } = mountBar();

    await push({ state: null, status: 'closed' });

    expect(wrapper.find('.connection').attributes('data-status')).toBe('closed');
    expect(wrapper.text()).toContain('Déconnecté');
  });
});

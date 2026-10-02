import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { ShopApplicationService, ShopView } from '../../application/ShopApplicationService';
import type { Customer } from '../../domain/Customer';
import ShopQueue from './ShopQueue.vue';
import { shopServiceKey } from './shopServiceKey';
import { useShopStore } from './useShopStore';

const state = (queue: Customer[]) => ({
  day: 1,
  minuteOfDay: 0,
  time: '08:00',
  dayLengthMinutes: 480,
  cashCents: 30000,
  queue,
});

function mountQueue() {
  const service = { start: vi.fn(), stop: vi.fn() } as unknown as ShopApplicationService;
  const pinia = createPinia();
  const wrapper = mount(ShopQueue, {
    global: { plugins: [pinia], provide: { [shopServiceKey as symbol]: service } },
  });
  const show = async (view: ShopView) => {
    // The queue only reads the store, the status bar is the one that starts the service.
    useShopStore(pinia).view = view;
    await nextTick();
  };
  return { wrapper, show };
}

describe('ShopQueue', () => {
  it('says that nobody waits before the first data', () => {
    const { wrapper } = mountQueue();

    expect(wrapper.text()).toContain("File d'attente (0)");
    expect(wrapper.text()).toContain("Personne n'attend.");
  });

  it('lists the waiting customers with their personality and drink', async () => {
    const { wrapper, show } = mountQueue();

    await show({
      state: state([
        { id: 4, personality: 'Pressé', drink: 'Espresso', patienceMinutes: 6, waitedMinutes: 1 },
        { id: 5, personality: 'Généreux', drink: 'Latte', patienceMinutes: 15, waitedMinutes: 0 },
      ]),
      status: 'open',
    });

    expect(wrapper.text()).toContain("File d'attente (2)");
    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]?.text()).toContain('#4 Pressé');
    expect(items[0]?.text()).toContain('Espresso');
    expect(items[1]?.text()).toContain('#5 Généreux');
  });

  it('shows the patience that is left, and warns when it is almost over', async () => {
    const { wrapper, show } = mountQueue();

    await show({
      state: state([
        { id: 1, personality: 'Décontracté', drink: 'Thé', patienceMinutes: 20, waitedMinutes: 5 },
        { id: 2, personality: 'Pressé', drink: 'Espresso', patienceMinutes: 6, waitedMinutes: 5 },
      ]),
      status: 'open',
    });

    const gauges = wrapper.findAll('.patience-left');
    expect(gauges[0]?.attributes('style')).toContain('width: 75%');
    expect(gauges[0]?.classes()).not.toContain('low');
    expect(gauges[1]?.classes()).toContain('low');
    expect(wrapper.findAll('.patience')[0]?.attributes('aria-label')).toBe(
      'Patience restante : 75 %',
    );
  });

  it('never shows a negative patience', async () => {
    const { wrapper, show } = mountQueue();

    await show({
      state: state([
        { id: 1, personality: 'Pressé', drink: 'Espresso', patienceMinutes: 6, waitedMinutes: 9 },
      ]),
      status: 'open',
    });

    expect(wrapper.find('.patience-left').attributes('style')).toContain('width: 0%');
  });
});

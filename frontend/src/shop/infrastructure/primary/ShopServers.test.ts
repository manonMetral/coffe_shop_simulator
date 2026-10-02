import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { ShopApplicationService } from '../../application/ShopApplicationService';
import type { Server } from '../../domain/Server';
import ShopServers from './ShopServers.vue';
import { shopServiceKey } from './shopServiceKey';
import { useShopStore } from './useShopStore';

const idle: Server = { name: 'Alice', speed: 1, drinks: ['Espresso', 'Thé', 'Latte'], order: null };
const busy: Server = {
  name: 'Bob',
  speed: 1.5,
  drinks: ['Espresso', 'Latte'],
  order: { orderId: 3, customerId: 12, drink: 'Latte', preparationMinutes: 4, remainingMinutes: 1 },
};

function mountServers() {
  const service = { start: vi.fn(), stop: vi.fn() } as unknown as ShopApplicationService;
  const pinia = createPinia();
  const wrapper = mount(ShopServers, {
    global: { plugins: [pinia], provide: { [shopServiceKey as symbol]: service } },
  });
  const show = async (servers: Server[]) => {
    // The component only reads the store, the status bar is the one that starts the service.
    useShopStore(pinia).view = {
      state: {
        day: 1,
        minuteOfDay: 0,
        time: '08:00',
        dayLengthMinutes: 480,
        cashCents: 30000,
        queue: [],
        servers,
      },
      status: 'open',
    };
    await nextTick();
  };
  return { wrapper, show };
}

describe('ShopServers', () => {
  it('shows nothing but the title before the first data', () => {
    const { wrapper } = mountServers();

    expect(wrapper.text()).toContain('Serveurs');
    expect(wrapper.findAll('li')).toHaveLength(0);
  });

  it('lists each server with its skills and its speed', async () => {
    const { wrapper, show } = mountServers();

    await show([idle, busy]);

    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]?.text()).toContain('Alice');
    expect(items[0]?.text()).toContain('Espresso, Thé, Latte');
    expect(items[1]?.text()).toContain('vitesse x1.5');
  });

  it('says that an idle server is free', async () => {
    const { wrapper, show } = mountServers();

    await show([idle]);

    expect(wrapper.find('li').text()).toContain('libre');
    expect(wrapper.find('li').classes()).not.toContain('busy');
  });

  it('shows the drink and the progress of a busy server', async () => {
    const { wrapper, show } = mountServers();

    await show([busy]);

    expect(wrapper.find('li').classes()).toContain('busy');
    expect(wrapper.find('li').text()).toContain('prépare Latte (client #12)');
    expect(wrapper.find('.progress-done').attributes('style')).toContain('width: 75%');
  });

  it('shows a finished preparation as complete, and never more', async () => {
    const { wrapper, show } = mountServers();

    await show([{ ...busy, order: { ...busy.order!, remainingMinutes: -1 } }]);
    expect(wrapper.find('.progress-done').attributes('style')).toContain('width: 100%');

    await show([{ ...busy, order: { ...busy.order!, remainingMinutes: 9 } }]);
    expect(wrapper.find('.progress-done').attributes('style')).toContain('width: 0%');
  });

  it('copes with an instant preparation', async () => {
    const { wrapper, show } = mountServers();

    await show([
      { ...busy, order: { ...busy.order!, preparationMinutes: 0, remainingMinutes: 0 } },
    ]);

    expect(wrapper.find('.progress-done').attributes('style')).toContain('width: 100%');
  });
});

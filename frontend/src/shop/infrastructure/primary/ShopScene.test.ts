import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import type { ShopApplicationService } from '../../application/ShopApplicationService';
import type { Customer } from '../../domain/Customer';
import type { Server } from '../../domain/Server';
import { MAX_VISIBLE_QUEUE } from './sceneEffects';
import ShopScene from './ShopScene.vue';
import { shopServiceKey } from './shopServiceKey';
import { mountWithShop, shopState } from './testShop';
import { useShopStore } from './useShopStore';

const customer = (id: number, changes: Partial<Customer> = {}): Customer => ({
  id,
  personality: 'Pressé',
  drink: 'Espresso',
  patienceMinutes: 6,
  waitedMinutes: 0,
  ...changes,
});

const alice: Server = { name: 'Alice', speed: 1, drinks: ['Espresso'], order: null };
const bob: Server = {
  name: 'Bob',
  speed: 1.5,
  drinks: ['Latte'],
  order: {
    orderId: 1,
    customerId: 9,
    personality: 'Généreux',
    drink: 'Latte',
    preparationMinutes: 4,
    remainingMinutes: 2,
  },
};

describe('ShopScene', () => {
  describe('the shop', () => {
    it('is empty before the first data', () => {
      const { wrapper } = mountWithShop(ShopScene);

      expect(wrapper.find('.station').exists()).toBe(false);
      expect(wrapper.find('.register').exists()).toBe(false);
      expect(wrapper.find('.sun').attributes('style')).toContain('left: 0%');
    });

    it('describes itself to the screen readers', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);

      await show({
        state: shopState({ queue: [customer(1), customer(2)], servers: [alice, bob] }),
      });

      expect(wrapper.find('.summary').text()).toBe(
        '2 clients en attente, 1 serveurs occupés sur 2',
      );
    });

    it('shows the customers who wait at the entrance, with their patience', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);

      await show({
        state: shopState({
          queue: [
            customer(1, { waitedMinutes: 3 }),
            customer(2, { personality: 'Décontracté', patienceMinutes: 25 }),
          ],
        }),
      });

      const customers = wrapper.findAll('.entrance .customer');
      expect(customers).toHaveLength(2);
      expect(customers[0]?.find('.patience-left').attributes('style')).toContain('width: 50%');
      expect(customers[1]?.find('.avatar').text()).toBe('😎');
    });

    it('only shows the first customers of a long queue, and counts the others', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);
      const queue = Array.from({ length: MAX_VISIBLE_QUEUE + 5 }, (_, index) =>
        customer(index + 1),
      );

      await show({ state: shopState({ queue }) });

      expect(wrapper.findAll('.entrance .customer')).toHaveLength(MAX_VISIBLE_QUEUE);
      expect(wrapper.find('.more').text()).toBe('+5 autres');
      expect(wrapper.find('.summary').text()).toContain(
        `${MAX_VISIBLE_QUEUE + 5} clients en attente`,
      );
    });

    it('shows no counter when the whole queue fits', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);

      await show({ state: shopState({ queue: [customer(1)] }) });

      expect(wrapper.find('.more').exists()).toBe(false);
    });

    it('shows a station for each server, and the customer served at the counter', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);

      await show({ state: shopState({ servers: [alice, bob] }) });

      const stations = wrapper.findAll('.station');
      expect(stations).toHaveLength(2);
      expect(stations[0]?.text()).toContain('libre');
      expect(stations[1]?.find('.customer').attributes('aria-label')).toContain('Client 9');
    });

    it('shows the cash register', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);

      await show({ state: shopState({ cashCents: 31250 }) });

      expect(wrapper.find('.cash').text().replace(/\s/g, ' ')).toBe('312,50 €');
    });

    it('shows how full the jars of the shelf are, and which ones are low', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);

      await show({
        state: shopState({
          inventory: [
            { ingredient: 'Café', quantity: 250, capacity: 1000, low: false },
            { ingredient: 'Lait', quantity: 50, capacity: 1000, low: true },
            { ingredient: 'Thé', quantity: -3, capacity: 1000, low: true },
            { ingredient: 'Eau', quantity: 1500, capacity: 1000, low: false },
          ],
        }),
      });

      const jars = wrapper.findAll('.jar');
      expect(jars).toHaveLength(4);
      expect(jars[0]?.find('.jar-filling').attributes('style')).toContain('height: 25%');
      expect(jars[0]?.find('.jar-symbol').text()).toBe('🫘');
      expect(jars[0]?.classes()).not.toContain('low');
      expect(jars[1]?.classes()).toContain('low');
      expect(jars[1]?.attributes('title')).toBe('Lait : 50 / 1000');
      expect(jars[2]?.find('.jar-filling').attributes('style')).toContain('height: 0%');
      expect(jars[3]?.find('.jar-filling').attributes('style')).toContain('height: 100%');
    });
  });

  describe('the time of the day', () => {
    it('moves the sun across the sky between the opening and the closing', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);

      await show({ state: shopState({ minuteOfDay: 240, dayLengthMinutes: 480 }) });
      const noon = wrapper.find('.sun').attributes('style');
      await show({ state: shopState({ minuteOfDay: 0, dayLengthMinutes: 480 }) });
      const morning = wrapper.find('.sun').attributes('style');

      expect(noon).toContain('left: 50%');
      expect(noon).toContain('top: 8%');
      expect(morning).toContain('left: 0%');
      expect(morning).toContain('top: 48%');
    });

    it('announces the rush hour', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);

      await show({ state: shopState({ rushHourMultiplier: 2.5 }) });
      expect(wrapper.classes()).toContain('rush');
      expect(wrapper.find('.rush-banner').text()).toBe('Rush hour x2.5');

      await show({ state: shopState({ rushHourMultiplier: 1 }) });
      expect(wrapper.classes()).not.toContain('rush');
      expect(wrapper.find('.rush-banner').exists()).toBe(false);
    });
  });

  describe('what happens in the shop', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const delivered = {
      type: 'order-delivered',
      orderId: 1,
      customerId: 9,
      drink: 'Latte',
      server: 'Bob',
      priceCents: 780,
      tipCents: 0,
      cashCents: 30780,
    } as const;

    it('shows the money earned above the server who delivers a drink, for a moment', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);
      await show({ state: shopState({ servers: [alice, bob] }) });

      await show({
        state: shopState({ servers: [alice, bob] }),
        journal: [{ id: 1, day: 1, time: '08:10', event: delivered }],
      });

      const stations = wrapper.findAll('.station');
      expect(stations[0]?.find('.floater').exists()).toBe(false);
      expect(stations[1]?.find('.floater').text().replace(/\s/g, ' ')).toBe('+7,80 €');

      vi.advanceTimersByTime(2499);
      await show({
        state: shopState({ servers: [alice, bob] }),
        journal: [{ id: 1, day: 1, time: '08:10', event: delivered }],
      });
      expect(wrapper.find('.floater').exists()).toBe(true);

      vi.advanceTimersByTime(1);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.floater').exists()).toBe(false);
    });

    it('shows why a customer leaves at the entrance, and the delivery on the shelf', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);
      await show({});

      await show({
        journal: [
          {
            id: 2,
            day: 1,
            time: '08:11',
            event: { type: 'restock-delivered', ingredient: 'Lait', quantity: 250 },
          },
          {
            id: 1,
            day: 1,
            time: '08:11',
            event: { type: 'customer-left', customerId: 3, reason: 'patience' },
          },
        ],
      });

      expect(wrapper.find('.entrance .floater').text()).toBe('😠 part');
      expect(wrapper.find('.shelf .floater').text()).toBe('📦 +250 Lait');
    });

    it('does not replay the events that were already in the journal when it appeared', async () => {
      const service = { start: vi.fn(), stop: vi.fn() } as unknown as ShopApplicationService;
      const pinia = createPinia();
      const app = createApp({}).use(pinia).provide(shopServiceKey, service);
      const store = app.runWithContext(() => useShopStore());
      const journal = [{ id: 5, day: 1, time: '08:00', event: delivered }];
      store.view = { state: shopState({ servers: [alice, bob] }), status: 'open', journal };

      const wrapper = mount(ShopScene, {
        global: { plugins: [pinia], provide: { [shopServiceKey as symbol]: service } },
      });
      expect(wrapper.find('.floater').exists()).toBe(false);

      store.view = {
        ...store.view,
        journal: [{ id: 6, day: 1, time: '08:01', event: delivered }, ...journal],
      };
      await nextTick();

      expect(wrapper.findAll('.floater')).toHaveLength(1);
    });

    it('does not show the events that have no effect in the scene', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);
      await show({});

      await show({
        journal: [{ id: 1, day: 1, time: '08:00', event: { type: 'day-ended', day: 1 } }],
      });

      expect(wrapper.find('.floater').exists()).toBe(false);
    });

    it('stops its timers when it disappears', async () => {
      const { wrapper, show } = mountWithShop(ShopScene);
      await show({});
      await show({ journal: [{ id: 1, day: 1, time: '08:00', event: delivered }] });

      wrapper.unmount();

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});

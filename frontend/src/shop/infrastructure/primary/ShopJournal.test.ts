import { describe, expect, it } from 'vitest';
import ShopJournal from './ShopJournal.vue';
import { mountWithShop } from './testShop';

describe('ShopJournal', () => {
  it('says that nothing happened yet', () => {
    const { wrapper } = mountWithShop(ShopJournal);

    expect(wrapper.text()).toContain("Rien ne s'est encore passé.");
    expect(wrapper.find('ol').exists()).toBe(false);
  });

  it('writes the events with the day and the time, the most recent first', async () => {
    const { wrapper, show } = mountWithShop(ShopJournal);

    await show({
      journal: [
        { id: 2, day: 2, time: '09:30', event: { type: 'rush-hour-ended' } },
        { id: 1, day: 1, time: '15:59', event: { type: 'day-ended', day: 1 } },
      ],
    });

    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]?.text()).toContain('Jour 2 · 09:30');
    expect(items[0]?.text()).toContain('Fin du rush');
    expect(items[1]?.text()).toContain('Jour 1 · 15:59');
    expect(items[1]?.text()).toContain('Fin du jour 1');
  });

  it('skips the events that have no sentence', async () => {
    const { wrapper, show } = mountWithShop(ShopJournal);

    await show({
      journal: [{ id: 1, day: 1, time: '08:00', event: { type: 'queue-updated', queue: [] } }],
    });

    expect(wrapper.text()).toContain("Rien ne s'est encore passé.");
  });
});

import { describe, expect, it } from 'vitest';
import ShopInventory from './ShopInventory.vue';
import { mountWithShop, shopState } from './testShop';

describe('ShopInventory', () => {
  it('shows nothing but the title before the first data', () => {
    const { wrapper } = mountWithShop(ShopInventory);

    expect(wrapper.text()).toContain('Stock');
    expect(wrapper.findAll('li')).toHaveLength(0);
  });

  it('shows the quantity of each ingredient and how full its stock is', async () => {
    const { wrapper, show } = mountWithShop(ShopInventory);

    await show({
      state: shopState({
        inventory: [
          { ingredient: 'Café', quantity: 750, capacity: 1000, low: false },
          { ingredient: 'Lait', quantity: 1000, capacity: 1000, low: false },
        ],
      }),
    });

    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]?.text()).toContain('Café');
    expect(items[0]?.text()).toContain('750 / 1000');
    expect(items[0]?.find('.gauge-filling').attributes('style')).toContain('width: 75%');
    expect(items[0]?.find('.gauge').attributes('aria-label')).toBe('750 sur 1000');
    expect(items[1]?.find('.gauge-filling').attributes('style')).toContain('width: 100%');
  });

  it('warns when the stock is low', async () => {
    const { wrapper, show } = mountWithShop(ShopInventory);

    await show({
      state: shopState({
        inventory: [
          { ingredient: 'Thé', quantity: 90, capacity: 1000, low: true },
          { ingredient: 'Eau', quantity: 900, capacity: 1000, low: false },
        ],
      }),
    });

    const items = wrapper.findAll('li');
    expect(items[0]?.classes()).toContain('low');
    expect(items[0]?.text()).toContain('stock bas');
    expect(items[1]?.classes()).not.toContain('low');
    expect(items[1]?.text()).not.toContain('stock bas');
  });

  it('keeps the gauge between empty and full', async () => {
    const { wrapper, show } = mountWithShop(ShopInventory);

    await show({
      state: shopState({
        inventory: [
          { ingredient: 'Café', quantity: -5, capacity: 1000, low: true },
          { ingredient: 'Lait', quantity: 1200, capacity: 1000, low: false },
        ],
      }),
    });

    const gauges = wrapper.findAll('.gauge-filling');
    expect(gauges[0]?.attributes('style')).toContain('width: 0%');
    expect(gauges[1]?.attributes('style')).toContain('width: 100%');
  });
});

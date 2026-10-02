import { describe, expect, it } from 'vitest';
import type { DayReport } from '../../domain/DayReport';
import ShopReports from './ShopReports.vue';
import { mountWithShop, shopState } from './testShop';

const report = (changes: Partial<DayReport>): DayReport => ({
  day: 1,
  salesCents: 100000,
  tipsCents: 5000,
  restockCostCents: 40000,
  profitCents: 65000,
  customersServed: 120,
  customersLostPatience: 4,
  customersLostOutOfStock: 1,
  averageSatisfactionPercent: 87,
  closingCashCents: 95000,
  ...changes,
});

const cells = (row: { findAll: (selector: string) => { text: () => string }[] } | undefined) =>
  (row?.findAll('td') ?? []).map((cell) => cell.text().replace(/\s/g, ' '));

describe('ShopReports', () => {
  it('says that no day is over yet', () => {
    const { wrapper } = mountWithShop(ShopReports);

    expect(wrapper.text()).toContain('Aucune journée terminée.');
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('shows the accounts of each day that is over, the most recent first', async () => {
    const { wrapper, show } = mountWithShop(ShopReports);

    await show({
      state: shopState({ reports: [report({ day: 1 }), report({ day: 2, customersServed: 90 })] }),
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(cells(rows[0])[0]).toBe('2');
    expect(cells(rows[0])[5]).toBe('90');
    expect(cells(rows[1])).toEqual([
      '1',
      '1 000,00 €',
      '50,00 €',
      '400,00 €',
      '650,00 €',
      '120',
      '5',
      '87 %',
      '950,00 €',
    ]);
  });

  it('shows a profit in green and a loss in red', async () => {
    const { wrapper, show } = mountWithShop(ShopReports);

    await show({
      state: shopState({ reports: [report({ day: 1 }), report({ day: 2, profitCents: -20000 })] }),
    });

    const profits = wrapper.findAll('tbody tr').map((row) => row.findAll('td')[4]?.classes());
    expect(profits[0]).toContain('loss');
    expect(profits[1]).toContain('profit');
  });
});

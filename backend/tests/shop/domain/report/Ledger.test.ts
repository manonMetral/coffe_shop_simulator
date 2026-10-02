import { describe, expect, it } from 'vitest';
import { Ledger } from '../../../../src/shop/domain/report/Ledger.js';
import { Money } from '../../../../src/shop/domain/Money.js';

const euros = (amount: number) => Money.ofCents(amount * 100);

describe('Ledger', () => {
  it('has no report at the start', () => {
    expect(new Ledger().reports()).toEqual([]);
  });

  it('reports a quiet day with zeros', () => {
    const report = new Ledger().closeDay(1, euros(300));

    expect(report).toEqual({
      day: 1,
      salesCents: 0,
      tipsCents: 0,
      restockCostCents: 0,
      profitCents: 0,
      customersServed: 0,
      customersLostPatience: 0,
      customersLostOutOfStock: 0,
      averageSatisfactionPercent: 0,
      closingCashCents: 30000,
    });
  });

  it('adds up the sales, the tips, the purchases and the customers of the day', () => {
    const ledger = new Ledger();
    ledger.recordSale(euros(5), euros(1), 100);
    ledger.recordSale(euros(8), euros(0), 50);
    ledger.recordRestock(euros(4));
    ledger.recordLostCustomer('patience');
    ledger.recordLostCustomer('patience');
    ledger.recordLostCustomer('out-of-stock');

    expect(ledger.closeDay(3, euros(310))).toEqual({
      day: 3,
      salesCents: 1300,
      tipsCents: 100,
      restockCostCents: 400,
      profitCents: 1000,
      customersServed: 2,
      customersLostPatience: 2,
      customersLostOutOfStock: 1,
      averageSatisfactionPercent: 30,
      closingCashCents: 31000,
    });
  });

  it('counts the customers who were not served for 0 in the satisfaction', () => {
    const ledger = new Ledger();
    ledger.recordSale(euros(5), euros(0), 100);
    ledger.recordLostCustomer('patience');

    expect(ledger.closeDay(1, euros(305)).averageSatisfactionPercent).toBe(50);
  });

  it('can make a loss', () => {
    const ledger = new Ledger();
    ledger.recordSale(euros(5), euros(0), 100);
    ledger.recordRestock(euros(200));

    expect(ledger.closeDay(1, euros(105)).profitCents).toBe(-19500);
  });

  it('starts the next day from zero and keeps the reports of the days that are over', () => {
    const ledger = new Ledger();
    ledger.recordSale(euros(5), euros(1), 100);
    ledger.recordRestock(euros(2));
    ledger.recordLostCustomer('patience');
    ledger.closeDay(1, euros(304));

    const second = ledger.closeDay(2, euros(304));

    expect(second).toMatchObject({
      salesCents: 0,
      tipsCents: 0,
      restockCostCents: 0,
      customersServed: 0,
    });
    expect(second.customersLostPatience).toBe(0);
    expect(ledger.reports().map((report) => report.day)).toEqual([1, 2]);
  });

  it('does not let callers change the reports through the returned list', () => {
    const ledger = new Ledger();
    ledger.closeDay(1, euros(300));

    (ledger.reports() as unknown[]).pop();

    expect(ledger.reports()).toHaveLength(1);
  });
});

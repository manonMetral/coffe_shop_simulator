import { afterEach, describe, expect, it, vi } from 'vitest';

async function simulateDays(seed: string, days: number, customersPerHour = '20') {
  vi.stubEnv('RANDOM_SEED', seed);
  vi.stubEnv('CUSTOMERS_PER_HOUR', customersPerHour);
  vi.resetModules();
  const { createShopModule } = await import('../../src/composition/shop.js');
  const shop = createShopModule();

  const events: { type: string; [key: string]: unknown }[] = [];
  for (let tick = 0; tick < days * 480 * 5; tick += 1) {
    events.push(...((await shop.shop.advance(0.2, 1)) as typeof events));
  }
  return { shop, events };
}

describe('the shop over several days', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('serves customers and earns money', async () => {
    const { shop, events } = await simulateDays('42', 1);

    const delivered = events.filter((event) => event.type === 'order-delivered');
    const snapshot = await shop.shop.snapshot();
    expect(delivered.length).toBeGreaterThan(80);
    expect(snapshot.cashCents).toBeGreaterThan(30000 + 80 * 500);
    expect(
      events.filter((event) => event.type === 'customer-arrived').length,
    ).toBeGreaterThanOrEqual(delivered.length);
  });

  it('serves most customers before they lose patience with 3 servers', async () => {
    const { events } = await simulateDays('7', 1);

    const served = events.filter((event) => event.type === 'order-delivered').length;
    const lost = events.filter((event) => event.type === 'customer-left').length;
    expect(lost).toBeLessThan(served / 4);
  });

  it('pays the tips of the generous customers only', async () => {
    const { events } = await simulateDays('3', 1);

    const tips = events.filter(
      (event) => event.type === 'order-delivered' && (event.tipCents as number) > 0,
    );
    expect(tips.length).toBeGreaterThan(0);
    for (const tip of tips) {
      const ratio = (tip.tipCents as number) / (tip.priceCents as number);
      expect(ratio).toBeGreaterThanOrEqual(0.099);
      expect(ratio).toBeLessThanOrEqual(0.201);
    }
  });

  it('plays the same days again with the same seed', async () => {
    const first = await simulateDays('99', 1);
    const second = await simulateDays('99', 1);

    expect(first.events).toEqual(second.events);
  });

  it('consumes the stock while serving, and raises an alert after a few days', async () => {
    const { shop, events } = await simulateDays('5', 8);

    const stock = await shop.inventoryService.getInventory();
    expect(stock.some((level) => level.quantity < level.capacity)).toBe(true);
    expect(events.some((event) => event.type === 'stock-low')).toBe(true);
  }, 60000);

  it('buys ingredients when the stock is low and the cash allows it, and receives them later', async () => {
    const { shop, events } = await simulateDays('5', 5, '60');

    const ordered = events.filter((event) => event.type === 'restock-ordered');
    const delivered = events.filter((event) => event.type === 'restock-delivered');
    expect(ordered.length).toBeGreaterThan(0);
    expect(delivered.length).toBeGreaterThan(0);
    for (const order of ordered) {
      expect(order.quantity as number).toBeGreaterThanOrEqual(100);
      expect(order.quantity as number).toBeLessThanOrEqual(1000);
      expect(order.cashCents as number).toBeGreaterThanOrEqual(0);
    }
    const stock = await shop.inventoryService.getInventory();
    expect(stock.every((level) => level.quantity >= 0 && level.quantity <= level.capacity)).toBe(
      true,
    );
  }, 120000);

  it('never spends more than it has', async () => {
    const { events } = await simulateDays('8', 5, '60');

    const cashAfterEachChange = events
      .filter((event) => event.type === 'restock-ordered' || event.type === 'order-delivered')
      .map((event) => event.cashCents as number);
    expect(Math.min(...cashAfterEachChange)).toBeGreaterThanOrEqual(0);
  }, 120000);

  it('closes the accounts of a day into a report', async () => {
    const { shop } = await simulateDays('42', 1);

    const [event] = await shop.shop.closeDay(1);

    const report = (
      event as unknown as {
        report: {
          customersServed: number;
          salesCents: number;
          tipsCents: number;
          restockCostCents: number;
          averageSatisfactionPercent: number;
          closingCashCents: number;
        };
      }
    ).report;
    expect(report.customersServed).toBeGreaterThan(80);
    expect(report.salesCents).toBeGreaterThan(80 * 500);
    expect(report.averageSatisfactionPercent).toBeGreaterThan(50);
    expect(report.averageSatisfactionPercent).toBeLessThanOrEqual(100);
    expect(report.closingCashCents).toBe(
      30000 + report.salesCents + report.tipsCents - report.restockCostCents,
    );
  });
});

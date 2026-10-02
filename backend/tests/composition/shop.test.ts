import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function simulateDays(seed: string, days: number) {
  vi.stubEnv('RANDOM_SEED', seed);
  vi.resetModules();
  const { createShopModule } = await import('../../src/composition/shop.js');
  const shop = createShopModule();

  const events: { type: string; [key: string]: unknown }[] = [];
  for (let tick = 0; tick < days * 480 * 5; tick += 1) {
    events.push(...((await shop.shop.advance(0.2)) as typeof events));
  }
  return { shop, events };
}

describe('the shop over several days', () => {
  beforeEach(() => {
    vi.stubEnv('CUSTOMERS_PER_HOUR', '20');
  });

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
});

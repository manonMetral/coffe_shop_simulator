import { describe, expect, it } from 'vitest';
import type { ShopEvent } from '../../domain/ShopMessage';
import { FLOATER_DURATION_MS, floaterFor, MAX_VISIBLE_QUEUE } from './sceneEffects';

const normalized = (text: string | undefined) => text?.replace(/\s/g, ' ');

describe('floaterFor', () => {
  it('lasts a few seconds', () => {
    expect(FLOATER_DURATION_MS).toBe(2500);
  });

  it('shows the first 8 customers of the queue', () => {
    expect(MAX_VISIBLE_QUEUE).toBe(8);
  });

  it('shows the money earned above the server who delivers a drink', () => {
    const floater = floaterFor({
      type: 'order-delivered',
      orderId: 1,
      customerId: 4,
      drink: 'Latte',
      server: 'Bob',
      priceCents: 780,
      tipCents: 78,
      cashCents: 30858,
    });

    expect(normalized(floater?.text)).toBe('+8,58 €');
    expect(floater).toMatchObject({ kind: 'gain', place: { zone: 'server', server: 'Bob' } });
  });

  it.each([
    ['patience', '😠 part'],
    ['out-of-stock', '❌ rupture'],
  ] as const)('shows why a customer leaves (%s) at the entrance', (reason, text) => {
    expect(floaterFor({ type: 'customer-left', customerId: 4, reason })).toEqual({
      text,
      kind: 'bad',
      place: { zone: 'entrance' },
    });
  });

  it('shows the delivered ingredients on the shelf', () => {
    expect(floaterFor({ type: 'restock-delivered', ingredient: 'Café', quantity: 250 })).toEqual({
      text: '📦 +250 Café',
      kind: 'info',
      place: { zone: 'shelf' },
    });
  });

  it.each<ShopEvent>([
    { type: 'clock-tick', day: 1, minuteOfDay: 1, time: '08:01' },
    { type: 'order-started', orderId: 1, customerId: 1, drink: 'Latte', server: 'Bob' },
    { type: 'stock-low', ingredient: 'Café', remaining: 100 },
    { type: 'rush-hour-started', multiplier: 2.5 },
    { type: 'day-ended', day: 1 },
  ])('shows nothing for %j', (event) => {
    expect(floaterFor(event)).toBeNull();
  });
});

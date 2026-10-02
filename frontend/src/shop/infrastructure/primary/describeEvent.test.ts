import { describe, expect, it } from 'vitest';
import type { ShopEvent } from '../../domain/ShopMessage';
import { describeEvent } from './describeEvent';

const normalized = (text: string | null) => text?.replace(/\s/g, ' ') ?? null;

const customer = {
  id: 7,
  personality: 'Pressé',
  drink: 'Latte',
  patienceMinutes: 6,
  waitedMinutes: 0,
} as const;

const report = {
  day: 2,
  salesCents: 10000,
  tipsCents: 500,
  restockCostCents: 20000,
  profitCents: -9500,
  customersServed: 12,
  customersLostPatience: 1,
  customersLostOutOfStock: 0,
  averageSatisfactionPercent: 80,
  closingCashCents: 20500,
} as const;

describe('describeEvent', () => {
  it.each<[ShopEvent, string]>([
    [{ type: 'customer-arrived', customer }, '#7 (Pressé) arrive et veut un Latte'],
    [{ type: 'customer-left', customerId: 7, reason: 'patience' }, '#7 part, il a trop attendu'],
    [
      { type: 'customer-left', customerId: 7, reason: 'out-of-stock' },
      "#7 part, sa boisson n'est plus disponible",
    ],
    [
      { type: 'order-started', orderId: 1, customerId: 7, drink: 'Latte', server: 'Bob' },
      'Bob prépare un Latte pour #7',
    ],
    [
      {
        type: 'order-delivered',
        orderId: 1,
        customerId: 7,
        drink: 'Latte',
        server: 'Bob',
        priceCents: 780,
        tipCents: 0,
        cashCents: 30780,
      },
      'Bob sert un Latte à #7 : 7,80 €',
    ],
    [
      {
        type: 'order-delivered',
        orderId: 1,
        customerId: 7,
        drink: 'Latte',
        server: 'Bob',
        priceCents: 780,
        tipCents: 78,
        cashCents: 30858,
      },
      'Bob sert un Latte à #7 : 7,80 € (+ 0,78 € de pourboire)',
    ],
    [{ type: 'stock-low', ingredient: 'Café', remaining: 100 }, 'Stock bas : Café (100 restants)'],
    [
      {
        type: 'restock-ordered',
        ingredient: 'Lait',
        quantity: 250,
        costCents: 50000,
        cashCents: 1,
      },
      'Commande de 250 Lait pour 500,00 €',
    ],
    [{ type: 'restock-delivered', ingredient: 'Lait', quantity: 250 }, 'Livraison de 250 Lait'],
    [
      { type: 'rush-hour-started', multiplier: 2.5 },
      'Début du rush : les clients arrivent 2.5 fois plus souvent',
    ],
    [{ type: 'rush-hour-ended' }, 'Fin du rush'],
    [{ type: 'day-started', day: 3 }, 'Début du jour 3'],
    [{ type: 'day-ended', day: 2 }, 'Fin du jour 2'],
    [{ type: 'day-report', report }, 'Bilan du jour 2 : -95,00 € de bénéfice'],
  ])('writes %j', (event, expected) => {
    expect(normalized(describeEvent(event))).toBe(normalized(expected));
  });

  it.each<ShopEvent>([
    { type: 'clock-tick', day: 1, minuteOfDay: 1, time: '08:01' },
    { type: 'queue-updated', queue: [] },
    { type: 'servers-updated', servers: [] },
    { type: 'inventory-updated', inventory: [] },
  ])('does not write down %j', (event) => {
    expect(describeEvent(event)).toBeNull();
  });
});

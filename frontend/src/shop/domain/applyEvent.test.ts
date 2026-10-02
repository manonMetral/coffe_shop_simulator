import { describe, expect, it } from 'vitest';
import { applyEvent } from './applyEvent';
import type { Customer } from './Customer';
import type { DayReport } from './DayReport';
import type { Server } from './Server';
import type { StockLevel } from './Stock';
import type { ShopState } from './ShopState';

const rushed: Customer = {
  id: 1,
  personality: 'Pressé',
  drink: 'Espresso',
  patienceMinutes: 6,
  waitedMinutes: 0,
};
const relaxed: Customer = {
  id: 2,
  personality: 'Décontracté',
  drink: 'Latte',
  patienceMinutes: 25,
  waitedMinutes: 3,
};

const alice: Server = {
  name: 'Alice',
  speed: 1,
  drinks: ['Espresso', 'Latte'],
  order: {
    orderId: 1,
    customerId: 1,
    drink: 'Espresso',
    preparationMinutes: 2,
    remainingMinutes: 1,
  },
};

const state: ShopState = {
  day: 1,
  minuteOfDay: 10,
  time: '08:10',
  dayLengthMinutes: 480,
  cashCents: 30000,
  queue: [],
  servers: [],
  inventory: [],
  reports: [],
  rushHourMultiplier: 1,
};

describe('applyEvent', () => {
  it('updates the day and the time on a clock tick', () => {
    expect(
      applyEvent(state, { type: 'clock-tick', day: 2, minuteOfDay: 20, time: '08:20' }),
    ).toEqual({
      ...state,
      day: 2,
      minuteOfDay: 20,
      time: '08:20',
    });
  });

  it('updates the day when a day starts', () => {
    expect(applyEvent(state, { type: 'day-started', day: 2 })).toEqual({ ...state, day: 2 });
  });

  it('keeps the state when a day ends', () => {
    expect(applyEvent(state, { type: 'day-ended', day: 1 })).toBe(state);
  });

  it('adds the customer who arrives at the end of the queue', () => {
    const queued = { ...state, queue: [rushed] };

    expect(applyEvent(queued, { type: 'customer-arrived', customer: relaxed }).queue).toEqual([
      rushed,
      relaxed,
    ]);
  });

  it('removes the customer who leaves from the queue', () => {
    const queued = { ...state, queue: [rushed, relaxed] };

    expect(
      applyEvent(queued, { type: 'customer-left', customerId: 1, reason: 'patience' }).queue,
    ).toEqual([relaxed]);
  });

  it('replaces the queue with the one sent by the backend', () => {
    const queued = { ...state, queue: [rushed] };

    expect(applyEvent(queued, { type: 'queue-updated', queue: [relaxed] }).queue).toEqual([
      relaxed,
    ]);
  });

  it('shows the new balance of the cash register when a drink is delivered', () => {
    const delivered = applyEvent(state, {
      type: 'order-delivered',
      orderId: 1,
      customerId: 1,
      drink: 'Espresso',
      server: 'Alice',
      priceCents: 520,
      tipCents: 78,
      cashCents: 30598,
    });

    expect(delivered.cashCents).toBe(30598);
  });

  it('replaces the servers with the ones sent by the backend', () => {
    expect(applyEvent(state, { type: 'servers-updated', servers: [alice] }).servers).toEqual([
      alice,
    ]);
  });

  it.each([
    { type: 'order-started', orderId: 1, customerId: 1, drink: 'Espresso', server: 'Alice' },
    { type: 'stock-low', ingredient: 'Café', remaining: 100 },
    { type: 'restock-delivered', ingredient: 'Café', quantity: 250 },
  ] as const)('keeps the state on $type', (event) => {
    expect(applyEvent(state, event)).toBe(state);
  });

  it('shows the new balance of the cash register when ingredients are bought', () => {
    const bought = applyEvent(state, {
      type: 'restock-ordered',
      ingredient: 'Café',
      quantity: 250,
      costCents: 50000,
      cashCents: 50000,
    });

    expect(bought.cashCents).toBe(50000);
  });

  it('replaces the stock with the one sent by the backend', () => {
    const inventory: StockLevel[] = [
      { ingredient: 'Café', quantity: 90, capacity: 1000, low: true },
    ];

    expect(applyEvent(state, { type: 'inventory-updated', inventory }).inventory).toEqual(
      inventory,
    );
  });

  it('knows when a rush hour starts and ends', () => {
    const rush = applyEvent(state, { type: 'rush-hour-started', multiplier: 2.5 });
    expect(rush.rushHourMultiplier).toBe(2.5);

    expect(applyEvent(rush, { type: 'rush-hour-ended' }).rushHourMultiplier).toBe(1);
  });

  it('adds the report of a day that is over to the previous ones', () => {
    const report = (day: number): DayReport => ({
      day,
      salesCents: 1,
      tipsCents: 0,
      restockCostCents: 0,
      profitCents: 1,
      customersServed: 1,
      customersLostPatience: 0,
      customersLostOutOfStock: 0,
      averageSatisfactionPercent: 100,
      closingCashCents: 30001,
    });
    const first = applyEvent(state, { type: 'day-report', report: report(1) });

    expect(
      applyEvent(first, { type: 'day-report', report: report(2) }).reports.map((r) => r.day),
    ).toEqual([1, 2]);
  });
});

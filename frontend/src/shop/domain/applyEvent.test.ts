import { describe, expect, it } from 'vitest';
import { applyEvent } from './applyEvent';
import type { Customer } from './Customer';
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

const state: ShopState = {
  day: 1,
  minuteOfDay: 10,
  time: '08:10',
  dayLengthMinutes: 480,
  cashCents: 30000,
  queue: [],
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
});

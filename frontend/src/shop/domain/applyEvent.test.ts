import { describe, expect, it } from 'vitest';
import { applyEvent } from './applyEvent';
import type { ShopState } from './ShopState';

const state: ShopState = {
  day: 1,
  minuteOfDay: 10,
  time: '08:10',
  dayLengthMinutes: 480,
  cashCents: 30000,
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
});

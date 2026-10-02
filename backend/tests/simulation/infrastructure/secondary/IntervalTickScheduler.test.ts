import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntervalTickScheduler } from '../../../../src/simulation/infrastructure/secondary/IntervalTickScheduler.js';

describe('IntervalTickScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls back at every interval', () => {
    const onTick = vi.fn();
    new IntervalTickScheduler().schedule(onTick, 1000);

    vi.advanceTimersByTime(3500);

    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it('replaces the previous schedule', () => {
    const scheduler = new IntervalTickScheduler();
    const first = vi.fn();
    const second = vi.fn();
    scheduler.schedule(first, 1000);
    scheduler.schedule(second, 1000);

    vi.advanceTimersByTime(1000);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('stops calling back once cancelled', () => {
    const scheduler = new IntervalTickScheduler();
    const onTick = vi.fn();
    scheduler.schedule(onTick, 1000);

    scheduler.cancel();
    vi.advanceTimersByTime(5000);

    expect(onTick).not.toHaveBeenCalled();
  });

  it('can be cancelled when nothing is scheduled', () => {
    expect(() => new IntervalTickScheduler().cancel()).not.toThrow();
  });
});

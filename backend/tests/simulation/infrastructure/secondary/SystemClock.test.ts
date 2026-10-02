import { afterEach, describe, expect, it, vi } from 'vitest';
import { SystemClock } from '../../../../src/simulation/infrastructure/secondary/SystemClock.js';

describe('SystemClock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current time in milliseconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_000_000);

    expect(new SystemClock().now()).toBe(1_700_000_000_000);
  });
});

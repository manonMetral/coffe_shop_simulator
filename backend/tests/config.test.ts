import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  return (await import('../src/config.js')).config;
}

describe('config', () => {
  beforeEach(() => {
    vi.stubEnv('PORT', undefined);
    vi.stubEnv('CORS_ORIGIN', undefined);
    vi.stubEnv('STOCK_CAPACITY', undefined);
    vi.stubEnv('LOW_STOCK_THRESHOLD', undefined);
    for (const name of [
      'INITIAL_CASH_CENTS',
      'TIME_SCALE',
      'TICK_INTERVAL_MS',
      'DAY_LENGTH_MINUTES',
      'DAY_START_HOUR',
    ]) {
      vi.stubEnv(name, undefined);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses default values when the environment is empty', async () => {
    const config = await loadConfig();

    expect(config).toEqual({
      port: 3000,
      corsOrigin: 'http://localhost:5173',
      stockCapacity: 1000,
      lowStockThreshold: 100,
      initialCashCents: 30000,
      timeScale: 8,
      tickIntervalMs: 1000,
      dayLengthMinutes: 480,
      dayStartHour: 8,
    });
  });

  it('reads values from the environment', async () => {
    vi.stubEnv('PORT', '4000');
    vi.stubEnv('CORS_ORIGIN', 'http://example.test');
    vi.stubEnv('STOCK_CAPACITY', '500');
    vi.stubEnv('LOW_STOCK_THRESHOLD', '40');
    vi.stubEnv('INITIAL_CASH_CENTS', '1000');
    vi.stubEnv('TIME_SCALE', '4');
    vi.stubEnv('TICK_INTERVAL_MS', '500');
    vi.stubEnv('DAY_LENGTH_MINUTES', '240');
    vi.stubEnv('DAY_START_HOUR', '9');

    const config = await loadConfig();

    expect(config).toEqual({
      port: 4000,
      corsOrigin: 'http://example.test',
      stockCapacity: 500,
      lowStockThreshold: 40,
      initialCashCents: 1000,
      timeScale: 4,
      tickIntervalMs: 500,
      dayLengthMinutes: 240,
      dayStartHour: 9,
    });
  });
});

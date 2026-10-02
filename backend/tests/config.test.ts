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
      'CUSTOMERS_PER_HOUR',
      'RANDOM_SEED',
      'RESTOCK_DELAY_MINUTES',
      'RUSH_HOUR_START_MINUTE',
      'RUSH_HOUR_DURATION_MINUTES',
      'RUSH_HOUR_MULTIPLIER',
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
      customersPerHour: 20,
      randomSeed: expect.any(Number),
      restockDelayMinutes: 60,
      rushHourStartMinute: 240,
      rushHourDurationMinutes: 120,
      rushHourMultiplier: 2.5,
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
    vi.stubEnv('CUSTOMERS_PER_HOUR', '30');
    vi.stubEnv('RANDOM_SEED', '42');
    vi.stubEnv('RESTOCK_DELAY_MINUTES', '30');
    vi.stubEnv('RUSH_HOUR_START_MINUTE', '60');
    vi.stubEnv('RUSH_HOUR_DURATION_MINUTES', '90');
    vi.stubEnv('RUSH_HOUR_MULTIPLIER', '3');

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
      customersPerHour: 30,
      randomSeed: 42,
      restockDelayMinutes: 30,
      rushHourStartMinute: 60,
      rushHourDurationMinutes: 90,
      rushHourMultiplier: 3,
    });
  });

  it.each([
    ['TIME_SCALE', 'abc'],
    ['TIME_SCALE', ''],
    ['TIME_SCALE', '0'],
    ['TIME_SCALE', '-2'],
    ['TICK_INTERVAL_MS', 'abc'],
    ['TICK_INTERVAL_MS', '0'],
    ['TICK_INTERVAL_MS', '1.5'],
    ['CUSTOMERS_PER_HOUR', '0'],
    ['CUSTOMERS_PER_HOUR', 'abc'],
    ['RESTOCK_DELAY_MINUTES', '0'],
    ['RUSH_HOUR_START_MINUTE', '-1'],
    ['RUSH_HOUR_START_MINUTE', '1441'],
    ['RUSH_HOUR_DURATION_MINUTES', '1.5'],
    ['RUSH_HOUR_MULTIPLIER', '0'],
    ['RANDOM_SEED', '-1'],
    ['RANDOM_SEED', '1.5'],
    ['PORT', 'abc'],
    ['PORT', '70000'],
    ['STOCK_CAPACITY', '0'],
    ['LOW_STOCK_THRESHOLD', '-1'],
    ['INITIAL_CASH_CENTS', ' '],
    ['DAY_LENGTH_MINUTES', '1441'],
    ['DAY_START_HOUR', '24'],
    ['CORS_ORIGIN', ''],
  ])('rejects %s=%j', async (name, value) => {
    vi.stubEnv(name, value);

    await expect(loadConfig()).rejects.toThrow(new RegExp(`- ${name} must`));
  });

  it('reports every invalid variable at once', async () => {
    vi.stubEnv('TIME_SCALE', 'abc');
    vi.stubEnv('PORT', '0');

    await expect(loadConfig()).rejects.toThrow(/- PORT must[^]*- TIME_SCALE must/);
  });

  it('accepts a decimal time scale', async () => {
    vi.stubEnv('TIME_SCALE', '0.5');

    expect((await loadConfig()).timeScale).toBe(0.5);
  });

  describe('rush hour', () => {
    it('must end before the end of the day', async () => {
      vi.stubEnv('DAY_LENGTH_MINUTES', '300');

      await expect(loadConfig()).rejects.toThrow(
        '- RUSH_HOUR_START_MINUTE + RUSH_HOUR_DURATION_MINUTES must not exceed DAY_LENGTH_MINUTES (300)',
      );
    });

    it('can end exactly when the day ends', async () => {
      vi.stubEnv('DAY_LENGTH_MINUTES', '360');

      expect((await loadConfig()).dayLengthMinutes).toBe(360);
    });

    it('can be disabled with a duration of 0, whatever the length of the day', async () => {
      vi.stubEnv('DAY_LENGTH_MINUTES', '60');
      vi.stubEnv('RUSH_HOUR_DURATION_MINUTES', '0');

      expect((await loadConfig()).rushHourDurationMinutes).toBe(0);
    });
  });
});

type Env = Record<string, string | undefined>;

interface Rule {
  readonly expected: string;
  readonly accepts: (value: number) => boolean;
}

const integerBetween = (min: number, max = Number.MAX_SAFE_INTEGER): Rule => ({
  expected:
    max === Number.MAX_SAFE_INTEGER
      ? `an integer greater than or equal to ${min}`
      : `an integer between ${min} and ${max}`,
  accepts: (value) => Number.isInteger(value) && value >= min && value <= max,
});

const positiveNumber: Rule = {
  expected: 'a number greater than 0',
  accepts: (value) => Number.isFinite(value) && value > 0,
};

export class InvalidConfigError extends Error {
  constructor(problems: readonly string[]) {
    super(`Invalid configuration:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
    this.name = new.target.name;
  }
}

/** Reads and validates the configuration, reporting every invalid variable at once. */
export function parseConfig(env: Env) {
  const problems: string[] = [];

  const read = (name: string, fallback: number, rule: Rule): number => {
    const raw = env[name];
    if (raw === undefined) {
      return fallback;
    }
    // Number('') is 0: an empty variable must not silently become a valid value.
    const value = raw.trim() === '' ? Number.NaN : Number(raw);
    if (!rule.accepts(value)) {
      problems.push(`${name} must be ${rule.expected} (received "${raw}")`);
      return fallback;
    }
    return value;
  };

  const corsOrigin = env.CORS_ORIGIN ?? 'http://localhost:5173';
  if (corsOrigin.trim() === '') {
    problems.push('CORS_ORIGIN must not be empty');
  }

  const config = {
    port: read('PORT', 3000, integerBetween(1, 65535)),
    corsOrigin,
    stockCapacity: read('STOCK_CAPACITY', 1000, integerBetween(1)),
    lowStockThreshold: read('LOW_STOCK_THRESHOLD', 100, integerBetween(0)),
    initialCashCents: read('INITIAL_CASH_CENTS', 30000, integerBetween(0)),
    /** Simulated minutes elapsed per real minute: 8 simulated hours last 1 real hour. */
    timeScale: read('TIME_SCALE', 8, positiveNumber),
    tickIntervalMs: read('TICK_INTERVAL_MS', 1000, integerBetween(1)),
    dayLengthMinutes: read('DAY_LENGTH_MINUTES', 480, integerBetween(1, 24 * 60)),
    dayStartHour: read('DAY_START_HOUR', 8, integerBetween(0, 23)),
    /** Average number of customers arriving per simulated hour. */
    customersPerHour: read('CUSTOMERS_PER_HOUR', 20, positiveNumber),
    /** Same seed, same customers: set it to replay a simulation. Random by default. */
    randomSeed: read('RANDOM_SEED', Date.now(), integerBetween(0)),
  };

  if (problems.length > 0) {
    throw new InvalidConfigError(problems);
  }
  return config;
}

export const config = parseConfig(process.env);

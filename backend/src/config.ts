export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  stockCapacity: Number(process.env.STOCK_CAPACITY ?? 1000),
  lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD ?? 100),
  initialCashCents: Number(process.env.INITIAL_CASH_CENTS ?? 30000),
  /** Simulated minutes elapsed per real minute: 8 simulated hours last 1 real hour. */
  timeScale: Number(process.env.TIME_SCALE ?? 8),
  tickIntervalMs: Number(process.env.TICK_INTERVAL_MS ?? 1000),
  dayLengthMinutes: Number(process.env.DAY_LENGTH_MINUTES ?? 480),
  dayStartHour: Number(process.env.DAY_START_HOUR ?? 8),
};

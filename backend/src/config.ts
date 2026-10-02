export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  stockCapacity: Number(process.env.STOCK_CAPACITY ?? 1000),
  lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD ?? 100),
};

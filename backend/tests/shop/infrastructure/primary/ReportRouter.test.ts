import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../../src/app.js';
import { createShopModule } from '../../../../src/composition/shop.js';

describe('GET /api/reports', () => {
  it('has no report before the end of the first day', async () => {
    const response = await request(createApp()).get('/api/reports');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns the report of each day that is over', async () => {
    const shop = createShopModule();
    await shop.shop.closeDay(1);
    await shop.shop.closeDay(2);

    const response = await request(createApp(shop)).get('/api/reports');

    expect(response.body.map((report: { day: number }) => report.day)).toEqual([1, 2]);
    expect(response.body[0]).toMatchObject({ salesCents: 0, closingCashCents: 30000 });
  });
});

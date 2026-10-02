import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../../src/app.js';

describe('GET /api/inventory', () => {
  it('returns a full stock at the start', async () => {
    const response = await request(createApp()).get('/api/inventory');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { ingredient: 'Café', quantity: 1000, capacity: 1000, low: false },
      { ingredient: 'Lait', quantity: 1000, capacity: 1000, low: false },
      { ingredient: 'Thé', quantity: 1000, capacity: 1000, low: false },
      { ingredient: 'Eau', quantity: 1000, capacity: 1000, low: false },
    ]);
  });
});

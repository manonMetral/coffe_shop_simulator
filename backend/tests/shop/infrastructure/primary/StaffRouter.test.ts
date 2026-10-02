import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../../src/app.js';

describe('GET /api/staff', () => {
  it('returns the 3 servers of the shop with their speed and skills', async () => {
    const response = await request(createApp()).get('/api/staff');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { name: 'Alice', speed: 1, drinks: ['Espresso', 'Thé', 'Latte'], order: null },
      { name: 'Bob', speed: 1.5, drinks: ['Espresso', 'Latte'], order: null },
      { name: 'Chloé', speed: 0.8, drinks: ['Thé', 'Latte'], order: null },
    ]);
  });
});

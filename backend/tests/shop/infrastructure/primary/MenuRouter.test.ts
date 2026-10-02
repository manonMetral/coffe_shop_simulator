import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../../src/app.js';

describe('GET /api/menu', () => {
  it('returns the drinks with their price', async () => {
    const response = await request(createApp()).get('/api/menu');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
    expect(response.body[0]).toEqual({
      name: 'Espresso',
      costCents: 600,
      priceCents: 780,
      preparationMinutes: 2,
      recipe: [
        { ingredient: 'Café', quantity: 2 },
        { ingredient: 'Eau', quantity: 1 },
      ],
    });
  });
});

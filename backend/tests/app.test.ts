import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('app', () => {
  it('allows the configured CORS origin', async () => {
    const response = await request(createApp())
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(createApp()).get('/api/unknown');

    expect(response.status).toBe(404);
  });
});

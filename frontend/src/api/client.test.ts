import { afterEach, describe, expect, it, vi } from 'vitest';
import { getJson } from './client';

describe('getJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ a: 1 }) }));

    await expect(getJson('/api/x')).resolves.toEqual({ a: 1 });
  });

  it('throws on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(getJson('/api/x')).rejects.toThrow('HTTP 500 on /api/x');
  });
});

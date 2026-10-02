import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpHealthRepository } from './HttpHealthRepository';

describe('HttpHealthRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the health returned by the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', uptime: 3 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(new HttpHealthRepository().get()).resolves.toEqual({ status: 'ok', uptime: 3 });
    expect(fetchMock).toHaveBeenCalledWith('/api/health');
  });

  it('throws on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(new HttpHealthRepository().get()).rejects.toThrow('HTTP 500 on /api/health');
  });
});

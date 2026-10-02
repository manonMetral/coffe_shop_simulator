import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHealthStore } from './health';

describe('health store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('sets status to ok when the API answers ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', uptime: 1 }) }),
    );
    const store = useHealthStore();

    await store.check();

    expect(store.status).toBe('ok');
  });

  it('sets status to down when the API answers something else than ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ko', uptime: 1 }) }),
    );
    const store = useHealthStore();

    await store.check();

    expect(store.status).toBe('down');
  });

  it('sets status to down when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const store = useHealthStore();

    await store.check();

    expect(store.status).toBe('down');
  });
});

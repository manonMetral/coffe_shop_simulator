import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  return (await import('../src/config.js')).config;
}

describe('config', () => {
  beforeEach(() => {
    vi.stubEnv('PORT', undefined);
    vi.stubEnv('CORS_ORIGIN', undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses default values when the environment is empty', async () => {
    const config = await loadConfig();

    expect(config).toEqual({ port: 3000, corsOrigin: 'http://localhost:5173' });
  });

  it('reads values from the environment', async () => {
    vi.stubEnv('PORT', '4000');
    vi.stubEnv('CORS_ORIGIN', 'http://example.test');

    const config = await loadConfig();

    expect(config).toEqual({ port: 4000, corsOrigin: 'http://example.test' });
  });
});

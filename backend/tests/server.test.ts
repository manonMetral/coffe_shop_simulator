import { afterEach, describe, expect, it, vi } from 'vitest';

const { startServer } = vi.hoisted(() => ({
  startServer: vi.fn((_port: number, onListening: () => void) => onListening()),
}));

vi.mock('../src/bootstrap.js', () => ({ startServer }));

describe('server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts on the configured port and logs the url', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { config } = await import('../src/config.js');

    await import('../src/server.js');

    expect(startServer).toHaveBeenCalledWith(config.port, expect.any(Function));
    expect(log).toHaveBeenCalledWith(`Backend listening on http://localhost:${config.port}`);
  });
});

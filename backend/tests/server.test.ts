import { afterEach, describe, expect, it, vi } from 'vitest';

const { listen } = vi.hoisted(() => ({
  listen: vi.fn((_port: number, onListening: () => void) => onListening()),
}));

vi.mock('../src/app.js', () => ({ createApp: () => ({ listen }) }));

describe('server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listens on the configured port and logs the url', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { config } = await import('../src/config.js');

    await import('../src/server.js');

    expect(listen).toHaveBeenCalledWith(config.port, expect.any(Function));
    expect(log).toHaveBeenCalledWith(`Backend listening on http://localhost:${config.port}`);
  });
});

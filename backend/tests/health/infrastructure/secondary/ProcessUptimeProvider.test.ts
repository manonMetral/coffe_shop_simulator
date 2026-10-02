import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessUptimeProvider } from '../../../../src/health/infrastructure/secondary/ProcessUptimeProvider.js';

describe('ProcessUptimeProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the uptime of the Node.js process', () => {
    vi.spyOn(process, 'uptime').mockReturnValue(12.5);

    expect(new ProcessUptimeProvider().uptimeSeconds()).toBe(12.5);
  });
});

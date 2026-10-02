import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsoleLogger } from '../../../../src/simulation/infrastructure/secondary/ConsoleLogger.js';

describe('ConsoleLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the message and its cause on the error output', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new Error('boom');

    new ConsoleLogger().error('Something failed', cause);

    expect(error).toHaveBeenCalledWith('Something failed', cause);
  });
});

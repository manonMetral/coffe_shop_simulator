import { describe, expect, it, vi } from 'vitest';
import type { TypeScriptShop } from '../../../../src/shop/infrastructure/primary/TypeScriptShop.js';
import { ShopFlowAdapter } from '../../../../src/simulation/infrastructure/secondary/ShopFlowAdapter.js';

describe('ShopFlowAdapter', () => {
  it('makes the time go by through the entry point of the shop', async () => {
    const advance = vi.fn(async () => [{ type: 'queue-updated' }]);
    const flow = new ShopFlowAdapter({ advance } as unknown as TypeScriptShop);

    expect(await flow.advance(2)).toEqual([{ type: 'queue-updated' }]);
    expect(advance).toHaveBeenCalledWith(2);
  });

  it('reads the snapshot of the shop through the same entry point', async () => {
    const snapshot = { cashCents: 1, queue: [], servers: [] };
    const flow = new ShopFlowAdapter({
      snapshot: async () => snapshot,
    } as unknown as TypeScriptShop);

    expect(await flow.snapshot()).toBe(snapshot);
  });
});

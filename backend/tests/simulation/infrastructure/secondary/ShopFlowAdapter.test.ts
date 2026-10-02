import { describe, expect, it, vi } from 'vitest';
import type { TypeScriptShop } from '../../../../src/shop/infrastructure/primary/TypeScriptShop.js';
import { ShopFlowAdapter } from '../../../../src/simulation/infrastructure/secondary/ShopFlowAdapter.js';

describe('ShopFlowAdapter', () => {
  it('makes the time go by through the entry point of the shop', async () => {
    const advance = vi.fn(async () => [{ type: 'queue-updated' }]);
    const flow = new ShopFlowAdapter({ advance } as unknown as TypeScriptShop);

    expect(await flow.advance(2, 3)).toEqual([{ type: 'queue-updated' }]);
    expect(advance).toHaveBeenCalledWith(2, 3);
  });

  it('reads the snapshot of the shop through the same entry point', async () => {
    const snapshot = { cashCents: 1, queue: [], servers: [], inventory: [], reports: [] };
    const flow = new ShopFlowAdapter({
      snapshot: async () => snapshot,
    } as unknown as TypeScriptShop);

    expect(await flow.snapshot()).toBe(snapshot);
  });

  it('closes the accounts of a day through the same entry point', async () => {
    const closeDay = vi.fn(async () => [{ type: 'day-report' }]);
    const flow = new ShopFlowAdapter({ closeDay } as unknown as TypeScriptShop);

    expect(await flow.closeDay(4)).toEqual([{ type: 'day-report' }]);
    expect(closeDay).toHaveBeenCalledWith(4);
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { ShopApplicationService } from '../../../../src/shop/application/ShopApplicationService.js';
import { TypeScriptShop } from '../../../../src/shop/infrastructure/primary/TypeScriptShop.js';

describe('TypeScriptShop', () => {
  it('lets the other contexts make the time go by in the shop', async () => {
    const advance = vi.fn(async () => [{ type: 'queue-updated' as const, queue: [] }]);
    const shop = new TypeScriptShop({ advance } as unknown as ShopApplicationService);

    expect(await shop.advance(3, 2.5)).toEqual([{ type: 'queue-updated', queue: [] }]);
    expect(advance).toHaveBeenCalledWith(3, 2.5);
  });

  it('exposes a snapshot of the shop', async () => {
    const snapshot = { cashCents: 1, queue: [], servers: [], inventory: [], reports: [] };
    const shop = new TypeScriptShop({
      getSnapshot: async () => snapshot,
    } as unknown as ShopApplicationService);

    expect(await shop.snapshot()).toBe(snapshot);
  });

  it('closes the accounts of a day that is over', async () => {
    const closeDay = vi.fn(async () => []);
    const shop = new TypeScriptShop({ closeDay } as unknown as ShopApplicationService);

    await shop.closeDay(2);

    expect(closeDay).toHaveBeenCalledWith(2);
  });
});

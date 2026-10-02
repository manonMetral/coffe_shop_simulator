import { describe, expect, it, vi } from 'vitest';
import type { TypeScriptCustomers } from '../../../../src/shop/infrastructure/primary/TypeScriptCustomers.js';
import { ShopCustomerFlow } from '../../../../src/simulation/infrastructure/secondary/ShopCustomerFlow.js';

describe('ShopCustomerFlow', () => {
  it('makes the time go by through the customers entry point of the shop', async () => {
    const advance = vi.fn(async () => [{ type: 'queue-updated' }]);
    const flow = new ShopCustomerFlow({ advance } as unknown as TypeScriptCustomers);

    expect(await flow.advance(2)).toEqual([{ type: 'queue-updated' }]);
    expect(advance).toHaveBeenCalledWith(2);
  });

  it('reads the waiting customers through the same entry point', async () => {
    const queue = [{ id: 1 }];
    const flow = new ShopCustomerFlow({
      queue: async () => queue,
    } as unknown as TypeScriptCustomers);

    expect(await flow.queue()).toBe(queue);
  });
});

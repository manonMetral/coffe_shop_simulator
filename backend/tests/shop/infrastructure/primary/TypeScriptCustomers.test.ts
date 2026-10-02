import { describe, expect, it, vi } from 'vitest';
import type { CustomerApplicationService } from '../../../../src/shop/application/CustomerApplicationService.js';
import { TypeScriptCustomers } from '../../../../src/shop/infrastructure/primary/TypeScriptCustomers.js';

describe('TypeScriptCustomers', () => {
  it('lets the other contexts make the time go by for the customers', async () => {
    const advance = vi.fn(async () => [{ type: 'queue-updated' as const, queue: [] }]);
    const customers = new TypeScriptCustomers({ advance } as unknown as CustomerApplicationService);

    expect(await customers.advance(3)).toEqual([{ type: 'queue-updated', queue: [] }]);
    expect(advance).toHaveBeenCalledWith(3);
  });

  it('exposes the waiting customers', async () => {
    const queue = [{ id: 1 }];
    const customers = new TypeScriptCustomers({
      getQueue: async () => queue,
    } as unknown as CustomerApplicationService);

    expect(await customers.queue()).toBe(queue);
  });
});

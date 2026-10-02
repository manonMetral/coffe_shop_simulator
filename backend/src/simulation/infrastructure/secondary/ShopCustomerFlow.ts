import type { TypeScriptCustomers } from '../../../shop/infrastructure/primary/TypeScriptCustomers.js';
import type { BroadcastEvent } from '../../domain/BroadcastEvent.js';
import type { CustomerFlow } from '../../domain/CustomerFlow.js';

/** Follows the customers through the public entry point of the shop context. */
export class ShopCustomerFlow implements CustomerFlow {
  constructor(private readonly customers: TypeScriptCustomers) {}

  advance(simulatedMinutes: number): Promise<readonly BroadcastEvent[]> {
    return this.customers.advance(simulatedMinutes);
  }

  queue(): Promise<readonly object[]> {
    return this.customers.queue();
  }
}

import type { TypeScriptShop } from '../../../shop/infrastructure/primary/TypeScriptShop.js';
import type { BroadcastEvent } from '../../domain/BroadcastEvent.js';
import type { ShopFlow, ShopSnapshot } from '../../domain/ShopFlow.js';

/** Follows the shop through its public entry point. */
export class ShopFlowAdapter implements ShopFlow {
  constructor(private readonly shop: TypeScriptShop) {}

  advance(simulatedMinutes: number): Promise<readonly BroadcastEvent[]> {
    return this.shop.advance(simulatedMinutes);
  }

  snapshot(): Promise<ShopSnapshot> {
    return this.shop.snapshot();
  }
}

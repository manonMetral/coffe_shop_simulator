import type { ShopApplicationService } from '../../application/ShopApplicationService.js';
import type { ShopEvent, ShopSnapshot } from '../../application/ShopViews.js';

/** Entry point of the shop for the other bounded contexts. */
export class TypeScriptShop {
  constructor(private readonly shopService: ShopApplicationService) {}

  advance(simulatedMinutes: number): Promise<ShopEvent[]> {
    return this.shopService.advance(simulatedMinutes);
  }

  snapshot(): Promise<ShopSnapshot> {
    return this.shopService.getSnapshot();
  }
}

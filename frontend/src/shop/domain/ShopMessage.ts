import type { Customer, DrinkName } from './Customer';
import type { DayReport } from './DayReport';
import type { Server, ServerName } from './Server';
import type { ShopState } from './ShopState';
import type { IngredientName, StockLevel } from './Stock';

export type ShopEvent =
  | {
      readonly type: 'clock-tick';
      readonly day: number;
      readonly minuteOfDay: number;
      readonly time: string;
    }
  | { readonly type: 'day-started'; readonly day: number }
  | { readonly type: 'day-ended'; readonly day: number }
  | { readonly type: 'customer-arrived'; readonly customer: Customer }
  | {
      readonly type: 'customer-left';
      readonly customerId: number;
      readonly reason: 'patience' | 'out-of-stock';
    }
  | { readonly type: 'queue-updated'; readonly queue: readonly Customer[] }
  | {
      readonly type: 'order-started';
      readonly orderId: number;
      readonly customerId: number;
      readonly drink: DrinkName;
      readonly server: ServerName;
    }
  | {
      readonly type: 'order-delivered';
      readonly orderId: number;
      readonly customerId: number;
      readonly drink: DrinkName;
      readonly server: ServerName;
      readonly priceCents: number;
      readonly tipCents: number;
      /** Balance of the cash register after the payment. */
      readonly cashCents: number;
    }
  | { readonly type: 'stock-low'; readonly ingredient: IngredientName; readonly remaining: number }
  | {
      readonly type: 'restock-ordered';
      readonly ingredient: IngredientName;
      readonly quantity: number;
      readonly costCents: number;
      /** Balance of the cash register after the purchase. */
      readonly cashCents: number;
    }
  | {
      readonly type: 'restock-delivered';
      readonly ingredient: IngredientName;
      readonly quantity: number;
    }
  | { readonly type: 'inventory-updated'; readonly inventory: readonly StockLevel[] }
  | { readonly type: 'rush-hour-started'; readonly multiplier: number }
  | { readonly type: 'rush-hour-ended' }
  | { readonly type: 'day-report'; readonly report: DayReport }
  | { readonly type: 'servers-updated'; readonly servers: readonly Server[] };

/** Messages sent by the backend through the WebSocket. */
export type ShopMessage =
  | { readonly type: 'snapshot'; readonly data: ShopState }
  | { readonly type: 'event'; readonly data: ShopEvent };

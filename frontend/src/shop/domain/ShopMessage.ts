import type { ShopState } from './ShopState';

export type ShopEvent =
  | {
      readonly type: 'clock-tick';
      readonly day: number;
      readonly minuteOfDay: number;
      readonly time: string;
    }
  | { readonly type: 'day-started'; readonly day: number }
  | { readonly type: 'day-ended'; readonly day: number };

/** Messages sent by the backend through the WebSocket. */
export type ShopMessage =
  | { readonly type: 'snapshot'; readonly data: ShopState }
  | { readonly type: 'event'; readonly data: ShopEvent };

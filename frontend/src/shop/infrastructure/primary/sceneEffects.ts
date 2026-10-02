import type { ServerName } from '../../domain/Server';
import type { ShopEvent } from '../../domain/ShopMessage';
import { formatEuros } from './formatEuros';

/** Where a short-lived message floats in the scene. */
export type FloaterPlace =
  | { readonly zone: 'server'; readonly server: ServerName }
  | { readonly zone: 'entrance' }
  | { readonly zone: 'shelf' };

export interface Floater {
  readonly id: number;
  readonly text: string;
  readonly kind: 'gain' | 'bad' | 'info';
  readonly place: FloaterPlace;
}

/** The scene shows this many customers of the queue, the others are only counted. */
export const MAX_VISIBLE_QUEUE = 8;

/** How long a floating message stays in the scene. */
export const FLOATER_DURATION_MS = 2500;

/** The floating message that shows an event in the scene, or null for the events that are not shown. */
export function floaterFor(event: ShopEvent): Omit<Floater, 'id'> | null {
  switch (event.type) {
    case 'order-delivered':
      return {
        text: `+${formatEuros(event.priceCents + event.tipCents)}`,
        kind: 'gain',
        place: { zone: 'server', server: event.server },
      };
    case 'customer-left':
      return {
        text: event.reason === 'patience' ? '😠 part' : '❌ rupture',
        kind: 'bad',
        place: { zone: 'entrance' },
      };
    case 'restock-delivered':
      return {
        text: `📦 +${event.quantity} ${event.ingredient}`,
        kind: 'info',
        place: { zone: 'shelf' },
      };
    default:
      return null;
  }
}

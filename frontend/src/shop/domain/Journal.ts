import type { ShopEvent } from './ShopMessage';

/** An event of the shop, remembered with the moment it happened. */
export interface JournalEntry {
  readonly id: number;
  readonly day: number;
  readonly time: string;
  readonly event: ShopEvent;
}

/** The events that only keep the display up to date are not worth remembering. */
export function isJournalEvent(event: ShopEvent): boolean {
  switch (event.type) {
    case 'clock-tick':
    case 'queue-updated':
    case 'servers-updated':
    case 'inventory-updated':
      return false;
    default:
      return true;
  }
}

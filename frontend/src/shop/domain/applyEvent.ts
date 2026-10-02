import type { ShopEvent } from './ShopMessage';
import type { ShopState } from './ShopState';

export function applyEvent(state: ShopState, event: ShopEvent): ShopState {
  switch (event.type) {
    case 'clock-tick':
      return { ...state, day: event.day, minuteOfDay: event.minuteOfDay, time: event.time };
    case 'day-started':
      return { ...state, day: event.day };
    case 'customer-arrived':
      return { ...state, queue: [...state.queue, event.customer] };
    case 'customer-left':
      return {
        ...state,
        queue: state.queue.filter((customer) => customer.id !== event.customerId),
      };
    case 'queue-updated':
      return { ...state, queue: event.queue };
    case 'order-delivered':
      return { ...state, cashCents: event.cashCents };
    case 'servers-updated':
      return { ...state, servers: event.servers };
    // Nothing to change in the state: these events are for the journal of events.
    case 'day-ended':
    case 'order-started':
    case 'stock-low':
      return state;
  }
}

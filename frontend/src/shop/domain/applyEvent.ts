import type { ShopEvent } from './ShopMessage';
import type { ShopState } from './ShopState';

export function applyEvent(state: ShopState, event: ShopEvent): ShopState {
  switch (event.type) {
    case 'clock-tick':
      return { ...state, day: event.day, minuteOfDay: event.minuteOfDay, time: event.time };
    case 'day-started':
      return { ...state, day: event.day };
    case 'day-ended':
      return state;
    case 'customer-arrived':
      return { ...state, queue: [...state.queue, event.customer] };
    case 'customer-left':
      return {
        ...state,
        queue: state.queue.filter((customer) => customer.id !== event.customerId),
      };
    case 'queue-updated':
      return { ...state, queue: event.queue };
  }
}

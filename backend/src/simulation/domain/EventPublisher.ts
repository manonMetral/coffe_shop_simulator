import type { BroadcastEvent } from './BroadcastEvent.js';

export interface EventPublisher {
  publish(event: BroadcastEvent): void;
}

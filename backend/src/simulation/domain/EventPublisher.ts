import type { SimulationEvent } from './SimulationEvent.js';

export interface EventPublisher {
  publish(event: SimulationEvent): void;
}

import type { Clock } from '../../domain/Clock.js';

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

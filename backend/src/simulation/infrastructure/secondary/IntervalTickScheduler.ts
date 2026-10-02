import type { TickScheduler } from '../../domain/TickScheduler.js';

export class IntervalTickScheduler implements TickScheduler {
  private timer: NodeJS.Timeout | undefined;

  schedule(onTick: () => void, intervalMs: number): void {
    this.cancel();
    this.timer = setInterval(onTick, intervalMs);
  }

  cancel(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}

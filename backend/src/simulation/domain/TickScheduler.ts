export interface TickScheduler {
  schedule(onTick: () => void, intervalMs: number): void;
  cancel(): void;
}

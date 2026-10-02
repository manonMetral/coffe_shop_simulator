/** Reports failures that the simulation survives, so that they are not silently lost. */
export interface Logger {
  error(message: string, cause: unknown): void;
}

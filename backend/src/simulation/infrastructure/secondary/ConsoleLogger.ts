import type { Logger } from '../../domain/Logger.js';

export class ConsoleLogger implements Logger {
  error(message: string, cause: unknown): void {
    console.error(message, cause);
  }
}

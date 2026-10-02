import type { Health } from '../../domain/Health';
import type { HealthRepository } from '../../domain/HealthRepository';

export class HttpHealthRepository implements HealthRepository {
  async get(): Promise<Health> {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} on /api/health`);
    }
    return (await response.json()) as Health;
  }
}

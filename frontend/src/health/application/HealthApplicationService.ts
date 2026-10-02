import type { HealthRepository } from '../domain/HealthRepository';
import type { HealthStatus } from '../domain/HealthStatus';

export class HealthApplicationService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async check(): Promise<HealthStatus> {
    try {
      const health = await this.healthRepository.get();
      return health.status === 'ok' ? 'ok' : 'down';
    } catch {
      return 'down';
    }
  }
}

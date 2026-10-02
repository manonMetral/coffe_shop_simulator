import type { Health } from '../domain/Health.js';
import type { UptimeProvider } from '../domain/UptimeProvider.js';

export class HealthApplicationService {
  constructor(private readonly uptimeProvider: UptimeProvider) {}

  getHealth(): Health {
    return { status: 'ok', uptime: this.uptimeProvider.uptimeSeconds() };
  }
}

import type { UptimeProvider } from '../../domain/UptimeProvider.js';

export class ProcessUptimeProvider implements UptimeProvider {
  uptimeSeconds(): number {
    return process.uptime();
  }
}

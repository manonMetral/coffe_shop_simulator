import { describe, expect, it } from 'vitest';
import { HealthApplicationService } from '../../../src/health/application/HealthApplicationService.js';

describe('HealthApplicationService', () => {
  it('reports an ok status with the uptime given by the provider', () => {
    const service = new HealthApplicationService({ uptimeSeconds: () => 42 });

    expect(service.getHealth()).toEqual({ status: 'ok', uptime: 42 });
  });
});

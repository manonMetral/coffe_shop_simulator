import { describe, expect, it } from 'vitest';
import type { Health } from '../domain/Health';
import { HealthApplicationService } from './HealthApplicationService';

const serviceReturning = (health: Health) =>
  new HealthApplicationService({ get: async () => health });

describe('HealthApplicationService', () => {
  it('returns ok when the API answers ok', async () => {
    await expect(serviceReturning({ status: 'ok', uptime: 1 }).check()).resolves.toBe('ok');
  });

  it('returns down when the API answers something else than ok', async () => {
    await expect(serviceReturning({ status: 'ko', uptime: 1 }).check()).resolves.toBe('down');
  });

  it('returns down when the repository fails', async () => {
    const service = new HealthApplicationService({
      get: async () => {
        throw new Error('network');
      },
    });

    await expect(service.check()).resolves.toBe('down');
  });
});

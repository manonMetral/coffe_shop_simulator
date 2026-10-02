import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';
import type { HealthApplicationService } from '../../application/HealthApplicationService';
import type { HealthStatus } from '../../domain/HealthStatus';
import { healthServiceKey } from './healthServiceKey';
import { useHealthStore } from './useHealthStore';

function createStore(service?: HealthApplicationService) {
  const app = createApp({});
  app.use(createPinia());
  if (service) {
    app.provide(healthServiceKey, service);
  }
  return app.runWithContext(() => useHealthStore());
}

const serviceReturning = (status: HealthStatus) =>
  ({ check: async () => status }) as HealthApplicationService;

describe('useHealthStore', () => {
  it('starts with an unknown status', () => {
    expect(createStore(serviceReturning('ok')).status).toBe('unknown');
  });

  it('stores the status returned by the application service', async () => {
    const store = createStore(serviceReturning('down'));

    await store.check();

    expect(store.status).toBe('down');
  });

  it('fails when the application service is not provided', () => {
    expect(() => createStore()).toThrow('HealthApplicationService is not provided');
  });
});

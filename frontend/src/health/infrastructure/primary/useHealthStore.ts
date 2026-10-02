import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import type { HealthStatus } from '../../domain/HealthStatus';
import { healthServiceKey } from './healthServiceKey';

export const useHealthStore = defineStore('health', () => {
  const healthService = inject(healthServiceKey);
  if (!healthService) {
    throw new Error('HealthApplicationService is not provided');
  }

  const status = ref<HealthStatus>('unknown');

  const check = async () => {
    status.value = await healthService.check();
  };

  return { status, check };
});

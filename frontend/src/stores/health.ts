import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getJson } from '@/api/client';

interface HealthResponse {
  status: string;
  uptime: number;
}

export const useHealthStore = defineStore('health', () => {
  const status = ref<'unknown' | 'ok' | 'down'>('unknown');

  async function check() {
    try {
      const data = await getJson<HealthResponse>('/api/health');
      status.value = data.status === 'ok' ? 'ok' : 'down';
    } catch {
      status.value = 'down';
    }
  }

  return { status, check };
});

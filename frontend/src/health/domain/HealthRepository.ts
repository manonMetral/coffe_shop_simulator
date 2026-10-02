import type { Health } from './Health';

export interface HealthRepository {
  get(): Promise<Health>;
}

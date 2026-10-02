import type { InjectionKey } from 'vue';
import type { HealthApplicationService } from '../../application/HealthApplicationService';

export const healthServiceKey: InjectionKey<HealthApplicationService> = Symbol('healthService');

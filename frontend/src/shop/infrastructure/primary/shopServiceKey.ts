import type { InjectionKey } from 'vue';
import type { ShopApplicationService } from '../../application/ShopApplicationService';

export const shopServiceKey: InjectionKey<ShopApplicationService> = Symbol('shopService');

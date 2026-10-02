import { defineStore } from 'pinia';
import { inject, ref } from 'vue';
import type { ShopView } from '../../application/ShopApplicationService';
import { shopServiceKey } from './shopServiceKey';

export const useShopStore = defineStore('shop', () => {
  const shopService = inject(shopServiceKey);
  if (!shopService) {
    throw new Error('ShopApplicationService is not provided');
  }

  const view = ref<ShopView>({ state: null, status: 'connecting' });

  const start = () => {
    shopService.start((next) => {
      view.value = next;
    });
  };
  const stop = () => shopService.stop();

  return { view, start, stop };
});

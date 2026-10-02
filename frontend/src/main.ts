import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { HealthApplicationService } from './health/application/HealthApplicationService';
import { healthServiceKey } from './health/infrastructure/primary/healthServiceKey';
import { HttpHealthRepository } from './health/infrastructure/secondary/HttpHealthRepository';
import router from './router';
import { ShopApplicationService } from './shop/application/ShopApplicationService';
import { shopServiceKey } from './shop/infrastructure/primary/shopServiceKey';
import {
  WebSocketShopGateway,
  webSocketUrl,
} from './shop/infrastructure/secondary/WebSocketShopGateway';
import './style.css';

createApp(App)
  .provide(healthServiceKey, new HealthApplicationService(new HttpHealthRepository()))
  .provide(
    shopServiceKey,
    new ShopApplicationService(new WebSocketShopGateway(webSocketUrl(window.location))),
  )
  .use(createPinia())
  .use(router)
  .mount('#app');

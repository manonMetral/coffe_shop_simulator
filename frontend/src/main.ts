import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { ShopApplicationService } from './shop/application/ShopApplicationService';
import { shopServiceKey } from './shop/infrastructure/primary/shopServiceKey';
import {
  WebSocketShopGateway,
  webSocketUrl,
} from './shop/infrastructure/secondary/WebSocketShopGateway';
import './style.css';

createApp(App)
  .provide(
    shopServiceKey,
    new ShopApplicationService(new WebSocketShopGateway(webSocketUrl(window.location))),
  )
  .use(createPinia())
  .use(router)
  .mount('#app');

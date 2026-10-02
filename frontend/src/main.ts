import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { HealthApplicationService } from './health/application/HealthApplicationService';
import { healthServiceKey } from './health/infrastructure/primary/healthServiceKey';
import { HttpHealthRepository } from './health/infrastructure/secondary/HttpHealthRepository';
import router from './router';
import './style.css';

createApp(App)
  .provide(healthServiceKey, new HealthApplicationService(new HttpHealthRepository()))
  .use(createPinia())
  .use(router)
  .mount('#app');

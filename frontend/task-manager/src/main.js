import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles.css';
import ToastPlugin from './utils/toast';

createApp(App)
  .use(router)
  .use(ToastPlugin)
  .mount('#app');

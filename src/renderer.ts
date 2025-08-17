import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';
import router from './routes.js';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';

const app = createApp(App);
app.use(router);

// @ts-ignore -- PrimeVue types are not compatible
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      primary: 'emerald',
    },
  },
});

// @ts-ignore
app.use(ToastService);

app.mount('#app');

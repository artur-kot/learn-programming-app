import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';
import router from './routes.js';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';
import i18n from './i18n.js';
import './lib/supabaseClient.ts'; // initialize supabase client (optional side-effect import)
import pinia from './stores/index.js';

const app = createApp(App);
app.use(router);
app.use(i18n);
app.use(pinia);

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

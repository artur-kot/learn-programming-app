import { createApp } from 'vue';
import App from './renderer/App.vue';
import './renderer/styles.css';
import router from './renderer/routes.js';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';
import i18n from './renderer/i18n.js';
import pinia from './renderer/stores/index.js';
import { useAppearanceStore } from './renderer/stores/appearance.js';

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
      darkModeSelector: '.app-dark',
    },
  },
});

// @ts-ignore
app.use(ToastService);

app.mount('#app');

const appearance = useAppearanceStore();
await appearance.load();

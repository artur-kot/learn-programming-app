import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';
import router from './routes.js';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import ToastService from 'primevue/toastservice';
import i18n from './i18n.js';
import pinia from './stores/index.js';
import { useAppearanceStore } from './stores/appearance.js';

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

// Ensure theme is applied before mounting to prevent initial light flash when preference is 'system'

app.mount('#app');

const appearance = useAppearanceStore();
await appearance.load();
